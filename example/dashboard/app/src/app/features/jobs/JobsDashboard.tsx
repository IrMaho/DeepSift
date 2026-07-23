import React from 'react';
import { StatCard } from '../../components/StatCard';
import { Briefcase, Users, MapPin, UserCheck, CreditCard, FileUp } from 'lucide-react';

export const JobsDashboard: React.FC = () => {
  const recentJobs = [
    { title: 'UI Developer', company: 'Achies', time: '12 hrs ago', type: 'Full Time', level: 'Fresher' },
    { title: 'AWS Engineer', company: 'LifeSpace', time: '6 hrs ago', type: 'Part Time', level: '+1 yrs Experience' },
    { title: 'React Developer', company: 'MegaSoft', time: '14 hrs ago', type: 'Freelancer', level: 'Senior' },
    { title: 'Angular Developer', company: 'MegaSoft', time: '14 hrs ago', type: 'Full Time', level: '+2 yrs Experience' }
  ];

  const topCompanies = [
    { name: 'Obligation Pvt.Ltd', type: 'Remote/Onsite', tier: 'Basic', employees: 547, date: '24 Nov 2021' },
    { name: 'Voluptatem Pvt.Ltd', type: 'Remote/Onsite', tier: 'Pro', employees: 223, date: '13 Jan 2020' },
    { name: 'BloomTech Inc', type: 'Remote/Onsite', tier: 'Basic', employees: 189, date: '06 Sep 2020' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Jobs & Recruitment Dashboard</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monitor active job postings, applicants and recruiter metrics.</p>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-4">
          <StatCard title="TOTAL EMPLOYERS" value="256" trend="-1.05%" isPositive={false} icon={Briefcase} color="#5c67f7" />
        </div>
        <div className="col-span-4">
          <StatCard title="TOTAL CANDIDATES" value="4,026" trend="+0.40%" isPositive={true} icon={Users} color="#23b7e5" />
        </div>
        <div className="col-span-4">
          <StatCard title="TOTAL LOCATIONS" value="48" trend="+0.82%" isPositive={true} icon={MapPin} color="#f5b849" />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-4">
          <StatCard title="TOTAL RECRUITERS" value="1,116" trend="+0.21%" isPositive={true} icon={UserCheck} color="#26bf94" />
        </div>
        <div className="col-span-4">
          <StatCard title="TOTAL SUBSCRIPTIONS" value="1,468" trend="-0.15%" isPositive={false} icon={CreditCard} color="#8c57ff" />
        </div>
        <div className="col-span-4">
          <StatCard title="RESUME UPLOAD RATIO" value="34%" trend="+0.16%" isPositive={true} icon={FileUp} color="#e6533c" />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">Recent Jobs</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentJobs.map(job => (
              <div key={job.title + job.company} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{job.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.company} • {job.time}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span className="badge badge-primary">{job.type}</span>
                  <span className="badge badge-info">{job.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">Top Registered Companies</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Tier</th>
                  <th>Employees</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map(c => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><span className="badge badge-warning">{c.tier}</span></td>
                    <td>{c.employees}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
