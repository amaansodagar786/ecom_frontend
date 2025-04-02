import React, { useEffect } from 'react';
import {
    FaReact, FaPython, FaNodeJs, FaPhp, FaHtml5,
    FaJava, FaCss3Alt, FaFacebookF, FaLinkedinIn,
    FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhoneAlt,
    FaEnvelope, FaShoppingBag, FaUser, FaSearch, FaHeart, FaWhatsapp
} from 'react-icons/fa';
import { SiRazorpay } from "react-icons/si";
import { FaCcVisa , FaCcAmazonPay , FaCcMastercard  } from "react-icons/fa";
// import { SvgIcon } from '@mui/material';
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
                    <p>Your premium destination for quality products and exceptional shopping experiences. We bring you the best from around the world.</p>
                    <div className="footer-newsletter">
                        <h4>Subscribe to Newsletter</h4>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Your email address" />
                            <button>Subscribe</button>
                        </div>
                    </div>
                </div>

                <div className="footer-links">
                    <h4>Shop</h4>
                    <ul>
                        <li><a href="#">New Arrivals</a></li>
                        <li><a href="#">Featured Products</a></li>
                        <li><a href="#">Best Sellers</a></li>
                        <li><a href="#">Special Offers</a></li>
                        <li><a href="#">Gift Cards</a></li>
                    </ul>
                </div>

                <div className="footer-links">
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
                        <p>722B, 7th Floor, Hemkunt Chambers, Nehru Place, New Delhi, Delhi - 110019 
                        </p>
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
        {/* Visa Icon */}
        {/* <SvgIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12s4.5 10 10 10 10-4.5 10-10zM12 19.4c-4.1 0-7.4-3.3-7.4-7.4S7.9 4.6 12 4.6s7.4 3.3 7.4 7.4-3.3 7.4-7.4 7.4z" />
        </SvgIcon> */}
        <span><FaCcVisa /></span>

        {/* Mastercard Icon */}
        <span><FaCcMastercard /> </span>

        {/* PayPal Icon */}
       <span> < SiRazorpay/> </span> 

        {/* Amazon Pay Icon */}
        <span> <FaCcAmazonPay /> </span>
      </div>
    
                <p>&copy; {new Date().getFullYear()}by Maseehum Task Manager Pvt. Ltd. All Rights Reserved. | Designed with ❤ by Aesa Solutions</p>
            </div>
        </footer>
    );
};

export default Footer;