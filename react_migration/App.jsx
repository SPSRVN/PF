import React, { useState } from 'react';
import { portfolioData } from './data';
import { GlassCard, LiquidButton } from './components/UIComponents';
import ProfileCard from './components/ProfileCard';
import PixelCard from './components/PixelCard';
import GlassSurface from './components/GlassSurface';
import './App.css';

const PortfolioApp = () => {
    const [navOpen, setNavOpen] = useState(false);

    return (
        <div className="portfolio-root">
            {/* Header Navigation Bar with GlassSurface */}
            <nav id="navbar">
                <GlassSurface
                    borderRadius={100}
                    borderWidth={0.12}
                    brightness={50}
                    opacity={0.93}
                    blur={12}
                    displace={0}
                    backgroundOpacity={0.08}
                    saturation={1.6}
                    distortionScale={-220}
                    redOffset={0}
                    greenOffset={12}
                    blueOffset={24}
                    className="nav-container"
                >
                    <div className="nav-logo">
                        <span className="logo-text"><span>SP</span><span className="accent">_</span></span>
                    </div>
                    <ul className={`nav-menu ${navOpen ? 'active' : ''}`} id="nav-menu">
                        <li><a href="#home" className="nav-link active">Home</a></li>
                        <li><a href="#about" className="nav-link">About</a></li>
                        <li><a href="#experience" className="nav-link">Experience</a></li>
                        <li><a href="#projects" className="nav-link">Projects</a></li>
                        <li><a href="#training" className="nav-link">Training</a></li>
                        <li><a href="#skills" className="nav-link">Skills</a></li>
                        <li><a href="#contact" className="nav-link">Contact</a></li>
                        <li><a href="assets/resume.pdf" className="nav-btn-resume" download="Saravana_Prakash_Resume.pdf">Resume</a></li>
                    </ul>
                    <div className={`nav-toggle ${navOpen ? 'active' : ''}`} id="nav-toggle" onClick={() => setNavOpen(!navOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </GlassSurface>
            </nav>

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
                    iconUrl="/assets/csharp-pattern.svg"
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

            {/* Disclaimer Section */}
            <section id="disclaimer" className="disclaimer-section">
                <PixelCard variant="blue" className="disclaimer-card glass" gap={8} speed={35} colors="#00f2ff,#38bdf8,#0ea5e9,#0284c7,#ffffff">
                    <div className="disclaimer-header">
                        <div className="disclaimer-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h3 className="disclaimer-heading">Disclaimer &amp; Professional Notice</h3>
                    </div>
                    <p className="disclaimer-text">
                        The projects and case studies showcased on this portfolio website are for illustrative purposes only.
                        Some work is protected under Non-Disclosure Agreements (NDAs), and any proprietary information has been excluded or anonymized.
                        All prototypes, applications, and technical demonstrations reflect my role, skills, and experience as an XR Developer and are presented solely to showcase my development capabilities.
                        These materials are not intended for commercial use or redistribution.
                    </p>
                </PixelCard>
            </section>
        </div>
    );
};

export default PortfolioApp;

