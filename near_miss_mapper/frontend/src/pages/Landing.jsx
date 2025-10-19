import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkVeil from '../Reactbits/DarkVeil/DarkVeil';

export default function Landing() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const goMap = () => navigate('/map');
  const goToSignup = () => navigate('/signup');
  const goToLogin = () => navigate('/login');

  useEffect(() => {
    const sections = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Animate only once per element
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div style={{
      
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 'auto',
      height: 'auto',
      marginTop: '20px',
      width: '100vw'}}>
      
      <div style={{
        width: 'min(880px, 92vw)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
      
        gap: 24,
        background: '#111827',
        borderRadius: 16,
        padding: 24,
        color: '#e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
      }}>
        <div>
          <h2 style={{ margin: '4px 0 8px', fontSize: 32,textAlign: 'center' }}>Urban Near Miss Mapper</h2>
          <p style={{ margin: 0, color: '#9ca3af' }}>Report and visualize near‑miss incidents to make cities safer.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!token ? (
            <>
              <button onClick={goToSignup} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #2563eb', background: '#2563eb', color: 'white', fontWeight: 700 }}>Sign Up</button>
              <button onClick={goToLogin} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #374151', background: '#111827', color: '#e5e7eb', fontWeight: 700 }}>Sign In</button>
            </>
          ) : (
            <button onClick={goMap} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #22c55e', background: '#22c55e', color: 'white', fontWeight: 700 }}>Go to Map</button>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af' }}>Secure • Professional • Ready for Action</div>
      </div>
      <div className="ms-auto d-flex rounded border border-primary ps-2 pe-2 m-3 w-75 justify-content-start align-items-start bg-dark bg-opacity-75 reveal">
        <h2 className='text-2xl font-bold text-primary'>What is a Near-Miss?</h2>
        <ul>
        <li>
        <p className='pt-2'>A near-miss (also called a “close call” or “conflict”) is an event that could have resulted in a collision, injury or damage, but did not — often thanks to quick evasive action or sheer luck.</p></li>
        <li><p>In traffic and urban mobility contexts, these are interactions where a pedestrian, cyclist, vehicle or other road-user nearly collides, or comes within a critical threshold of collision.</p></li>
        </ul>
      </div>
      <div className="me-auto d-flex rounded border border-primary ps-2 pe-2 m-3 w-75 justify-content-start align-items-start bg-dark bg-opacity-75 reveal">
        <h2 className='text-2xl font-bold text-primary'>Why It Matters</h2>
        <ul>
        <li>
        <p className='pt-2'>Research shows that near-miss data strongly correlates with actual crash frequency. For example, in a city-wide study of 59,277 near-miss events, near-misses had the strongest correlation with observed crashes.</p></li>
        <li><p>Because actual crashes are relatively few, relying only on crash data means many risk spots remain invisible until too late. Near-misses occur far more frequently, offering a richer dataset for proactive safety.</p></li>
        <li><p>By identifying and mapping near-misses, urban planners and policymakers can proactively address unsafe conditions before they escalate into crashes.</p></li>
        <li><p>By capturing near-misses, cities and transport planners can intervene before a serious injury or fatality occurs — shifting from reactive to proactive safety.</p></li>
        </ul>
      </div>
      <div className="ms-auto d-flex rounded border border-primary ps-2 pe-2 m-3 w-75 justify-content-start align-items-start bg-dark bg-opacity-75 reveal">
        <h2 className='text-2xl font-bold text-primary'>How “Urban Near Miss” Works</h2>
        <ul>
          <h6 className='text-xl font-bold text-primary pt-2'>Select a Route</h6 >
        <li>
        <p>Users pick a travel route (walking, cycling, driving or public transit) and the tool displays historic near-miss events along or near that route.</p></li>
        <h6 className='text-xl font-bold text-primary'>Visualise the Risk</h6 >
        <li><p>A map layer shows near-miss incidents (time, type of interaction, severity proxy) plus hotspots/clusters of repeated near-misses.
        Hotspots/clusters are visualized using a heat map or cluster markers, with brighter colors indicating higher concentrations of near-misses.</p></li>
        <h6 className='text-xl font-bold text-primary'>Choose a Route and travel</h6 >
        <li><p>Travelers can choose the route after visualizing the risk.</p></li>
        <h6 className='text-xl font-bold text-primary'>Report a Near-Miss</h6 >
        <li><p>Users (or organisations) can submit a near-miss incident: location, mode, description, optional photo, timestamp.</p></li>
        </ul>
      </div>
      <div className="me-auto d-flex rounded border border-primary ps-2 pe-2 m-3 w-75 justify-content-start align-items-start bg-dark bg-opacity-75 reveal">
        <h2 className='text-2xl font-bold text-primary'>Benefits & Use Cases</h2>
        <ul>
          <li className='pt-2'>Commuters & Road-Users: See the “hidden risk” along your usual route — know if you’re walking or cycling in a zone where near-misses happen often, so you can stay extra alert or choose an alternate path.</li>
          <li className='pt-2'>City Planners & Transport Authorities: Access a richer dataset of near-misses to identify hotspots, prioritise infrastructure upgrades (bike lanes, pedestrian crossings, traffic-calming) and allocate resources more effectively.</li>
          <li className='pt-2'>Community Organisations & Advocacy Groups: Have evidence to support safety campaigns, public-engagement, or area-specific interventions (e.g., safer crossings near schools).</li>
          <li className='pt-2'>Researchers & Data Scientists: Use mapped and contextualised near-miss data to model risk, understand patterns (mode mixes, infrastructure conditions, segment features) and contribute to proactive safety strategies.</li>
        </ul>
      </div>
      <div className="ms-auto d-flex rounded border border-primary ps-2 pe-2 m-3 w-75 justify-content-start align-items-start bg-dark bg-opacity-75 reveal">
        <h2 className='text-2xl font-bold text-primary'>Future Enhancement</h2>
        <ul>
        <li className='pt-2'>Automatic detection of near­-miss events using device/vehicle sensors and external feeds</li>
<li className='pt-2'>Predictive risk scoring: estimate likelihood of future incidents on a route based on historic near-miss density + segment features</li>
<li className='pt-2'>Integration with city open data and mobility platforms (for example, traffic volumes, signal timings, pedestrian counts)</li>
<li className='pt-2'>Partnership with local authorities and transport agencies to feed insights into safety improvement processes</li>
<li className='pt-2'>Mobile app version to allow near-miss reporting on-the-go and route awareness for users</li>
<li className='pt-2'>Real-time alerts for users traversing high-near-miss zones (optional opt-in)</li>
        </ul>
        </div>
    </div>
  );
}