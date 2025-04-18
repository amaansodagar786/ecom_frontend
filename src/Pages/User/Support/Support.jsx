import React, { useState } from 'react';
import { 
  FiHeadphones, 
  FiMail, 
  FiPhone, 
  FiMessageSquare, 
  FiChevronDown, 
  FiChevronUp,
  FiClock,
  FiMapPin,
  FiHelpCircle,
  FiTruck,
  FiCreditCard,
  FiShield,
  FiRefreshCw
} from 'react-icons/fi';
import UserLayout from '../../User/UserPanel/UserLayout';
import './Support.scss';

const Support = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, you'll receive a tracking number via email. You can enter this number in our 'Track Order' page or directly on the courier's website."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Items must be unused, in original packaging with all accessories. Some exclusions apply for opened software or personalized items."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by destination. You'll see exact costs at checkout."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and select cryptocurrencies for certain products."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach us 24/7 through our live chat, email at support@yourstore.com, or phone at +1 (800) 123-4567 during business hours (9AM-6PM EST)."
    },
    {
      question: "Are my payments secure?",
      answer: "Absolutely. We use industry-standard SSL encryption and never store your full payment details. All transactions are processed through PCI-compliant payment gateways."
    }
  ];

  const supportTopics = [
    {
      icon: <FiTruck size={24} />,
      title: "Shipping Information",
      description: "Learn about delivery options, timelines, and costs",
      link: "#shipping"
    },
    {
      icon: <FiRefreshCw size={24} />,
      title: "Returns & Exchanges",
      description: "How to return or exchange an item",
      link: "#returns"
    },
    {
      icon: <FiCreditCard size={24} />,
      title: "Payment Options",
      description: "Accepted payment methods and security",
      link: "#payments"
    },
    {
      icon: <FiShield size={24} />,
      title: "Warranty & Support",
      description: "Product warranties and technical support",
      link: "#warranty"
    }
  ];

  return (
    <UserLayout>
      <div className="support-container">
        <div className="support-hero">
          <div className="hero-content">
            <h1>How can we help you today?</h1>
            <p>We're here to help with any questions about your orders, products, or account.</p>
            
          </div>
          <div className="hero-image">
            <FiHelpCircle size={120} />
          </div>
        </div>

        <div className="support-tabs">
          <button 
            className={activeTab === 'faq' ? 'active' : ''} 
            onClick={() => setActiveTab('faq')}
          >
            FAQs
          </button>
          <button 
            className={activeTab === 'contact' ? 'active' : ''} 
            onClick={() => setActiveTab('contact')}
          >
            Contact Us
          </button>
          <button 
            className={activeTab === 'topics' ? 'active' : ''} 
            onClick={() => setActiveTab('topics')}
          >
            Support Topics
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'faq' && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`} key={index}>
                    <div className="faq-question" onClick={() => toggleFaq(index)}>
                      <h3>{faq.question}</h3>
                      {expandedFaq === index ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {expandedFaq === index && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-section">
              <h2>Contact Our Support Team</h2>
              <div className="contact-methods">
                <div className="contact-card">
                  <div className="contact-icon">
                    <FiHeadphones size={32} />
                  </div>
                  <h3>Live Chat</h3>
                  <p>Available 24/7 for instant support</p>
                  <button className="contact-btn">Start Chat</button>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">
                    <FiMail size={32} />
                  </div>
                  <h3>Email Us</h3>
                  <p>Typically respond within 2 hours</p>
                  <button className="contact-btn">Send Email</button>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">
                    <FiPhone size={32} />
                  </div>
                  <h3>Call Us</h3>
                  <p>9AM-6PM IST, Monday to Friday</p>
                  <button className="contact-btn">+91 1234567890</button>
                </div>
              </div>
              
              <div className="contact-info">
                <div className="info-card">
                  <FiMapPin size={24} />
                  <div>
                    <h4>Our Headquarters</h4>
                    <p>Delhi , India</p>
                  </div>
                </div>
                <div className="info-card">
                  <FiClock size={24} />
                  <div>
                    <h4>Business Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                    <p>Saturday - Sunday: 10:00 AM - 4:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="topics-section">
              <h2>Support Topics</h2>
              <div className="topics-grid">
                {supportTopics.map((topic, index) => (
                  <a href={topic.link} className="topic-card" key={index}>
                    <div className="topic-icon">{topic.icon}</div>
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                    <span className="learn-more">Learn more →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default Support;