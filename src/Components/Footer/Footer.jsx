import React, { useEffect } from 'react';
import {

    FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp,
    FaMapMarkerAlt, FaPhoneAlt, FaEnvelope,
} from 'react-icons/fa';
import { FaShoppingCart, FaMobileAlt, FaLaptop, FaHeadphones, FaTv, FaCameraRetro } from 'react-icons/fa';
import './Footer.scss';
import { useNavigate } from 'react-router-dom';

const Footer = () => {

    const navigate = useNavigate();

    const handleNewArrivalsClick = () => {
        navigate('/products', { state: { sortBy: 'newest' } });
    };

    const handleFeaturedProductsClick = () => {
        navigate('/products');
    };

    const handleHomeClick = () => {
        navigate('/');
    };


    const handleFaqsClick = (e) => {
        e.preventDefault();
        navigate('/support', { state: { activeTab: 'faq' } });
    };

    const handleContactUsClick = (e) => {
        e.preventDefault();
        navigate('/support', { state: { activeTab: 'contact' } });
    };

    const handleShippingPolicyClick = (e) => {
        e.preventDefault();
        navigate('/support', { state: { activeTab: 'topics' } });
    };

    const handleDownloadClick = (e) => {
        e.preventDefault();
        navigate('/drivers');
    };


    useEffect(() => {
        const socialBubbles = document.querySelectorAll('.social-bubble');
        socialBubbles.forEach(bubble => {
            const duration = 10 + Math.random() * 10;
            bubble.style.animationDuration = `${duration}s`;
            const delay = Math.random() * 15;
            bubble.style.animationDelay = `${delay}s`;
            const left = Math.random() * 100;
            bubble.style.left = `${left}%`;
            const size = 30 + Math.random() * 20;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
        });
    }, []);

    return (
        <footer className="footer">

            <div className="floating-social-icons">
                <div className="social-bubble"><FaShoppingCart /></div>
                <div className="social-bubble"><FaMobileAlt /></div>
                <div className="social-bubble"><FaLaptop /></div>
                <div className="social-bubble"><FaHeadphones /></div>
                <div className="social-bubble"><FaTv /></div>
                <div className="social-bubble"><FaCameraRetro /></div>
            </div>

            <div className="footer-content">
                <div className="footer-about">
                    <a href="#" className="footer-logo">MTM Store</a>
                    <p>Your premium destination for quality products and exceptional shopping experiences.</p>
                    {/* <div className="footer-newsletter">
                        <h4>Subscribe to Newsletter</h4>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Your email address" />
                            <button>Subscribe</button>
                        </div>
                    </div> */}
                </div>

                {/* <div className="footer-links hide-on-mobile"> */}
                <div className="footer-links ">
                    <h4>Pages</h4>
                    <ul>

                        <li><a href="" onClick={handleHomeClick}>Home</a></li>
                        <li><a href="" onClick={handleNewArrivalsClick}>New Arrivals</a></li>
                        <li><a href="" onClick={handleFeaturedProductsClick}>Featured Products</a></li>
                        <li><a href="" onClick={handleDownloadClick}>Drivers</a></li>

                        {/* <li><a href="#">Gift Cards</a></li> */}
                    </ul>
                </div>

                <div className="footer-links hide-on-mobile">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="/support" onClick={handleContactUsClick}>Contact Us</a></li>
                        <li><a href="/support" onClick={handleFaqsClick}>FAQs</a></li>
                        <li><a href="/support" onClick={handleShippingPolicyClick}>Shipping Policy</a></li>
                        <li><a href="/support" onClick={handleShippingPolicyClick}>Returns & Exchanges</a></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h4>Contact Us</h4>
                    <div className="contact-info-item">
                        <FaMapMarkerAlt />
                        <p>722B, 7th Floor, Hemkunt Chambers, Nehru Place, New Delhi, Delhi - 110019</p>
                    </div>
                    <div className="contact-info-item">
                        <FaPhoneAlt />
                        <p>011-47186444 , +919311886444</p>
                    </div>
                    <div className="contact-info-item">
                        <FaEnvelope />
                        <p>sales@mtm-store.com</p>
                    </div>
                    <div className="footer-social">
                        <a href="https://www.facebook.com/maseehum/"><FaFacebookF /></a>
                        <a href="https://www.instagram.com/ashfaq.mtm"><FaInstagram /></a>
                        <a href="https://x.com/i/flow/login?redirect_after_login=%2Fashfaq_delhi"><FaTwitter /></a>
                        <a href="https://wa.me/+911171068611"><FaWhatsapp /></a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">

                <p>&copy; {new Date().getFullYear()} by Maseehum Task Manager Pvt. Ltd. All Rights Reserved. | Designed with ❤ by Aesa Solutions</p>
            </div>
        </footer>
    );
};

export default Footer;
