import React, { useEffect } from 'react';
import {
    FaReact, FaNodeJs, FaShoppingBag, FaUser, FaSearch, FaHeart,
    FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp,
    FaMapMarkerAlt, FaPhoneAlt, FaEnvelope,
    FaCcVisa, FaCcAmazonPay, FaCcMastercard
} from 'react-icons/fa';
import { SiRazorpay } from "react-icons/si";
import './Footer.scss';

const Footer = () => {
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
                <div className="social-bubble"><FaShoppingBag /></div>
                <div className="social-bubble"><FaUser /></div>
                <div className="social-bubble"><FaSearch /></div>
                <div className="social-bubble"><FaHeart /></div>
                <div className="social-bubble"><FaReact /></div>
                <div className="social-bubble"><FaNodeJs /></div>
            </div>

            <div className="footer-content">
                <div className="footer-about">
                    <a href="#" className="footer-logo">MTM Store</a>
                    <p>Your premium destination for quality products and exceptional shopping experiences.</p>
                    <div className="footer-newsletter">
                        <h4>Subscribe to Newsletter</h4>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Your email address" />
                            <button>Subscribe</button>
                        </div>
                    </div>
                </div>

                <div className="footer-links hide-on-mobile">
                    <h4>Shop</h4>
                    <ul>
                        <li><a href="#">New Arrivals</a></li>
                        <li><a href="#">Featured Products</a></li>
                        <li><a href="#">Best Sellers</a></li>
                        <li><a href="#">Special Offers</a></li>
                        <li><a href="#">Gift Cards</a></li>
                    </ul>
                </div>

                <div className="footer-links hide-on-mobile">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">FAQs</a></li>
                        <li><a href="#">Shipping Policy</a></li>
                        <li><a href="#">Returns & Exchanges</a></li>
                        <li><a href="#">Size Guide</a></li>
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
                        <p>011-47186444</p>
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
                <div className="payment-methods">
                    <span><FaCcVisa /></span>
                    <span><FaCcMastercard /></span>
                    <span><SiRazorpay /></span>
                    <span><FaCcAmazonPay /></span>
                </div>
                <p>&copy; {new Date().getFullYear()} by Maseehum Task Manager Pvt. Ltd. All Rights Reserved. | Designed with ❤ by Aesa Solutions</p>
            </div>
        </footer>
    );
};

export default Footer;
