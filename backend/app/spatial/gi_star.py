import os
import io
from typing import Literal, Optional, Tuple, Dict, Any

import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon
from pyproj import CRS
from statsmodels.stats.multitest import multipletests

from libpysal.weights import Queen, Rook, KNN, DistanceBand
from esda.getisord import G_Local


def _ensure_metric_crs(gdf: gpd.GeoDataFrame) -> Tuple[gpd.GeoDataFrame, CRS]:
    """Project to a metric CRS (Web Mercator) if in geographic coordinates."""
    if gdf.crs is None:
        # Assume WGS84 if missing
        gdf = gdf.set_crs(4326, allow_override=True)
    if CRS.from_user_input(gdf.crs).is_geographic:
        gdf = gdf.to_crs(3857)
    return gdf, gdf.crs


def _build_weights(gdf: gpd.GeoDataFrame,
                   method: Literal['queen', 'rook', 'knn', 'distance_band'],
                   k: int = 8,
                   distance_band: Optional[float] = None,
                   use_centroids: bool = False):
    # For non-polygonal geometries, or if requested, use centroids
    if use_centroids or not gdf.geom_type.isin(['Polygon', 'MultiPolygon']).all():
        geoms = gdf.geometry.centroid
    else:
        geoms = gdf.geometry

    if method == 'queen':
        w = Queen.from_dataframe(gpd.GeoDataFrame(geometry=geoms))
    elif method == 'rook':
        w = Rook.from_dataframe(gpd.GeoDataFrame(geometry=geoms))
    elif method == 'knn':
        w = KNN.from_dataframe(gpd.GeoDataFrame(geometry=geoms), k=k)
    elif method == 'distance_band':
        if distance_band is None:
            raise ValueError("distance_band (meters) is required for distance_band method")
        # DistanceBand expects coordinates in a metric CRS
        w = DistanceBand.from_dataframe(gpd.GeoDataFrame(geometry=geoms), threshold=distance_band, binary=False, silence_warnings=True)
    else:
        raise ValueError(f"Unknown neighborhood method: {method}")

    w.transform = 'R'  # Row-standardize to mitigate edge effects
    return w


def _fdr_correction(p_values: np.ndarray, alpha: float = 0.05) -> np.ndarray:
    rejected, pval_corr, _, _ = multipletests(p_values, alpha=alpha, method='fdr_bh')
    return rejected


def _classify_hot_cold(z: np.ndarray) -> np.ndarray:
    # Return labels: 'hot_99', 'hot_95', 'hot_90', 'cold_90', 'cold_95', 'cold_99', or 'not_significant'
    labels = np.array(['not_significant'] * len(z), dtype=object)
    # Hot spots
    labels[(z >= 2.58)] = 'hot_99'
    labels[(z >= 1.96) & (z < 2.58)] = 'hot_95'
    labels[(z >= 1.65) & (z < 1.96)] = 'hot_90'
    # Cold spots
    labels[(z <= -2.58)] = 'cold_99'
    labels[(z <= -1.96) & (z > -2.58)] = 'cold_95'
    labels[(z <= -1.65) & (z > -1.96)] = 'cold_90'
    return labels


def gi_star(
    gdf: gpd.GeoDataFrame,
    value_field: str,
    neighborhood_method: Literal['queen', 'rook', 'knn', 'distance_band'] = 'queen',
    k: int = 8,
    distance_band_m: Optional[float] = None,
    permutations: int = 999,
    fdr: bool = True,
    use_centroids: bool = False,
) -> gpd.GeoDataFrame:
    """
    Compute Getis-Ord Gi* statistics on a GeoDataFrame.

    Returns the input GeoDataFrame with added columns:
      - gi_star
      - z_score
      - p_value
      - fdr_significant (bool)
      - significance (hot/cold classification)
    """
    if value_field not in gdf.columns:
        raise ValueError(f"value_field '{value_field}' not found in GeoDataFrame")

    gdf_metric, _ = _ensure_metric_crs(gdf)
    w = _build_weights(gdf_metric, neighborhood_method, k=k, distance_band=distance_band_m, use_centroids=use_centroids)

    y = gdf_metric[value_field].to_numpy(dtype=float)
    y = np.nan_to_num(y, nan=0.0)

    # Compute local G*
    gl = G_Local(y, w, star=True, permutations=permutations)

    # Extract stats
    gi = gl.Gs  # local G or G*
    # z-scores are available as standardized values
    try:
        z = gl.Zs
    except Exception:
        # Fallback: standardize Gi by its mean/std
        z = (gi - np.nanmean(gi)) / (np.nanstd(gi) + 1e-9)
    p = gl.p_sim if hasattr(gl, 'p_sim') else gl.p_z_sim

    gdf_out = gdf_metric.copy()
    gdf_out['gi_star'] = gi
    gdf_out['z_score'] = z
    gdf_out['p_value'] = p

    # FDR correction
    if fdr:
        gdf_out['fdr_significant'] = _fdr_correction(gdf_out['p_value'].to_numpy())
    else:
        gdf_out['fdr_significant'] = gdf_out['p_value'] <= 0.05

    # Significance classification by z-score thresholds
    gdf_out['significance'] = _classify_hot_cold(gdf_out['z_score'].to_numpy())

    return gdf_out


def save_as_shapefile(gdf: gpd.GeoDataFrame, out_dir: str, filename: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    # Ensure CRS is set; use WGS84 for export compatibility
    if gdf.crs is None:
        gdf = gdf.set_crs(3857, allow_override=True)
    gdf_wgs84 = gdf.to_crs(4326)
    out_path = os.path.join(out_dir, f"{filename}.shp")
    gdf_wgs84.to_file(out_path, driver='ESRI Shapefile')
    return out_path


def events_to_grid(
    events_df: pd.DataFrame,
    lon_field: str = 'lon',
    lat_field: str = 'lat',
    cell_size_m: float = 250.0,
    buffer_m: float = 0.0,
) -> gpd.GeoDataFrame:
    """
    Create a fishnet grid over the events' extent and count points per cell.
    Returns a GeoDataFrame with a 'count' field.
    """
    if events_df.empty:
        raise ValueError("No events available to build grid")
    pts = gpd.GeoDataFrame(events_df.copy(), geometry=gpd.points_from_xy(events_df[lon_field], events_df[lat_field]), crs=4326)
    pts, _ = _ensure_metric_crs(pts)

    xmin, ymin, xmax, ymax = pts.total_bounds
    if buffer_m > 0:
        xmin -= buffer_m
        ymin -= buffer_m
        xmax += buffer_m
        ymax += buffer_m

    cols = list(np.arange(xmin, xmax + cell_size_m, cell_size_m))
    rows = list(np.arange(ymin, ymax + cell_size_m, cell_size_m))

    polygons = []
    for x in range(len(cols) - 1):
        for y in range(len(rows) - 1):
            poly = Polygon([(cols[x], rows[y]),
                            (cols[x+1], rows[y]),
                            (cols[x+1], rows[y+1]),
                            (cols[x], rows[y+1])])
            polygons.append(poly)
    grid = gpd.GeoDataFrame({'id': np.arange(len(polygons))}, geometry=polygons, crs=pts.crs)

    # Spatial join for counts
    join = gpd.sjoin(pts, grid, predicate='within', how='left')
    counts = join.groupby('id').size().rename('count').to_frame().reset_index()
    grid = grid.merge(counts, on='id', how='left')
    grid['count'] = grid['count'].fillna(0).astype(int)
    return grid
