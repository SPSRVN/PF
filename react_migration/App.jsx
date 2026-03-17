import React from 'react';
import { portfolioData } from './data';
import { GlassCard, LiquidButton } from './components/UIComponents';
import ProfileCard from './components/ProfileCard';
import './App.css';

const PortfolioApp = () => {
    return (
        <div className="portfolio-root">
            {/* Hero Section */}
            <section id="home" className="hero">
                <ProfileCard
                  name={portfolioData.profile.name}
                  title={portfolioData.profile.title}
                  handle="srvnsp"
                  status="Online"
                  contactText="Contact Me"
                  avatarUrl="/assets/profile_authentic.png"
                  showUserInfo
                  enableTilt={true}
                  enableMobileTilt
                  onContactClick={() => {
                        const contactSection = document.getElementById('contact');
                        if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  behindGlowColor="hsla(14, 100%, 70%, 0.6)"
                  iconUrl=""
                  behindGlowEnabled
                  innerGradient="linear-gradient(145deg,hsla(14, 40%, 45%, 0.55) 0%,hsla(179, 60%, 70%, 0.27) 100%)"
                />

                <div className="cta-group">
                    <LiquidButton variant="primary">View Projects</LiquidButton>
                    <LiquidButton variant="secondary">Download Resume</LiquidButton>
                </div>
            </section>

            {/* Featured Projects Grid */}
            <section id="projects" className="projects-section">
                <h2 className="section-title">Featured Projects</h2>
                <div className="projects-grid">
                    {portfolioData.projects.map(project => (
                        <GlassCard
                            key={project.id}
                            title={project.title}
                            description={project.description}
                            highlight={project.highlight}
                        >
                            <div className="tags">
                                {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Experience Timeline */}
            <section id="experience" className="experience-section">
                {portfolioData.experience.map((exp, i) => (
                    <GlassCard key={i} className="timeline-item">
                        <span className="date">{exp.date}</span>
                        <h3>{exp.role}</h3>
                        <h4>{exp.company}</h4>
                        <ul>
                            {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </GlassCard>
                ))}
            </section>
        </div>
    );
};

export default PortfolioApp;
