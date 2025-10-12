import React from 'react';
import { Link } from 'react-router-dom';
import { useNavbarEffects, useFadeScroll, useMobileNav, useCarouselEffects } from '../hooks/effects';
import Footer from '../components/footer';

// CSS (adjust paths to match your project)
import '../assets/css/global.css';
import '../assets/css/navbar.css';
import '../assets/css/hero.css';
import '../assets/css/features.css';
import '../assets/css/footer.css';
import uniLogo from '../assets/images/uni_logo.png';

export default function HomePage() {
	useNavbarEffects();
	useFadeScroll();
	useMobileNav();
	useCarouselEffects();
    
    

	return (
		<div>
			<header>
				<nav className="navbar" id="navbar">
					<img src={uniLogo} alt="Website Logo" width="90" height="90" />
					<div className="logo"><h3>Faculty Resources Reservation</h3></div>
					<ul className="nav-links" id="nav-links">
						<li>
							<Link to="/login" className="btn-primary" style={{marginRight: '1rem'}}>Login</Link>
						</li>
						<li>
							<Link to="/register" className="btn-secondary">Register</Link>
						</li>
					</ul>
					<div className="burger" id="burger">
						<div className="line1"></div>
						<div className="line2"></div>
						<div className="line3"></div>
					</div>
				</nav>
			</header>

			<main>
				<section className="hero">
					<div className="hero-content fade-scroll-move" data-fade-start="50">
						<h1>Welcome to USJP Faculty Resources Reservation System</h1>
						<p>Efficiently manage and reserve faculty resources with our intuitive platform. Book classrooms, equipment, and more with just a few clicks.</p>
						<div className="hero-buttons fade-scroll-move" data-fade-start="100">
							<Link to="/login" className="btn-primary">Login</Link>
							<Link to="/register" className="btn-secondary">Register</Link>
						</div>
					</div>
					<div className="hero-image fade-scroll-move" data-fade-start="150">
						<img src="https://media.istockphoto.com/id/1931634876/photo/learn-digital-courses-computer-technology-online-internet-training-by-virtual-knowledge.jpg?s=612x612&w=0&k=20&c=P_iifqnE3Ki5qEkVkeZLJeou85LkttrVBkbWOQ8fX5o=" alt="Faculty Resources" />
					</div>
				</section>

				<section className="about-us">
					<h2 className="fade-scroll-move" data-fade-start="450">About Us</h2>
					<div className="about-content">
						<p className="fade-scroll-move" data-fade-start="600">
							<span className="quote-mark">"</span>
							The Faculty Resources Reservation System is designed to streamline the process of booking and managing educational resources for faculty members. 
							Whether it's reserving classrooms, projectors, or lab equipment, our platform offers a user-friendly interface that saves time and ensures efficient resource allocation.
							<span className="quote-mark">"</span>
						</p>
						<p className="fade-scroll-move" data-fade-start="700">
							<span className="quote-mark">"</span>
							Our mission is to support educators by providing a reliable system that reduces administrative workload and improves transparency in resource usage. 
							Built with modern web technologies, the system is secure, scalable, and easy to use.
							<span className="quote-mark">"</span>
						</p>
					</div>
				</section>

				<section className="features" id="features-section">
					<h2>Key Features</h2>
					<div className="carousel-wrapper">
						<div className="carousel-track" id="carousel-track">
							<div className="feature-card">
								<div className="feature-icon">📅</div>
								<h3>Easy Scheduling</h3>
								<p>Book resources in advance with our simple calendar interface.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">🔍</div>
								<h3>Resource Tracking</h3>
								<p>Keep track of all available resources and their usage.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">📊</div>
								<h3>Detailed Reports</h3>
								<p>Generate reports for resource utilization and booking history.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">📞</div>
								<h3>Contact Support</h3>
								<p>Get quick assistance for any booking or system issues.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">✏️</div>
								<h3>Easy to Modify</h3>
								<p>Easily change existing bookings with instant updates.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">🛡️</div>
								<h3>User Roles</h3>
								<p>Manage access levels for faculty, admins, and departments.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">📅</div>
								<h3>Easy Scheduling</h3>
								<p>Book resources in advance with our simple calendar interface.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">🔍</div>
								<h3>Resource Tracking</h3>
								<p>Keep track of all available resources and their usage.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">📊</div>
								<h3>Detailed Reports</h3>
								<p>Generate reports for resource utilization and booking history.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">📞</div>
								<h3>Contact Support</h3>
								<p>Get quick assistance from our support team for any booking or system issues.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">✏️</div>
								<h3>Booking Modification</h3>
								<p>Easily edit or cancel existing bookings with instant updates.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">🛡️</div>
								<h3>User Roles</h3>
								<p>Manage access levels for faculty, admins, and departments.</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}