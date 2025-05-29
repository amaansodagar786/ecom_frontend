import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminPanel/AdminLayout';
import axios from 'axios';
import './Offers.scss';

const Offers = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [offerText, setOfferText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
                setProducts(response.data);
                setFilteredProducts(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const results = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const openOfferModal = (product, editing = false) => {
        setSelectedProduct(product);
        setOfferText(product.offers || '');
        setIsEditing(editing);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setOfferText('');
        setIsEditing(false);
    };

    const handleOfferChange = (e) => {
        setOfferText(e.target.value);
    };

    const saveOffer = async () => {
        if (!selectedProduct) {
            console.warn("Missing selectedProduct");
            return;
        }

        try {
            const payload = {
                product_id: selectedProduct.product_id,
                offer_text: offerText.trim() || null
            };

            const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/offers`, payload);

            // Update local state
            const updatedProducts = products.map(product =>
                product.product_id === selectedProduct.product_id
                    ? { ...product, offers: offerText.trim() || null }
                    : product
            );

            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);
            closeModal();
        } catch (err) {
            console.error("Error updating offer:", err);
            setError(err.message);
        }
    };

    const removeOffer = async (productId) => {
        if (window.confirm("Are you sure you want to remove this offer?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_SERVER_API}/offers/${productId}`);

                // Update local state
                const updatedProducts = products.map(product =>
                    product.product_id === productId
                        ? { ...product, offers: null }
                        : product
                );

                setProducts(updatedProducts);
                setFilteredProducts(updatedProducts);
            } catch (err) {
                console.error("Error removing offer:", err);
                setError(err.message);
            }
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="offers-loading">
                    <div className="spinner"></div>
                    <p>Loading products...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="offers-error">
                    <p>Error: {error}</p>
                    <button onClick={handleBack} className="back-button">
                        Go Back
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="offers-container">
                <div className="offers-header">
                    <h1>Product Offers Management</h1>
                    <div className="header-actions">
                        <button onClick={handleBack} className="back-button">
                            &larr; Back
                        </button>
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                    </div>
                </div>

                <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => {
                            const baseUrl = import.meta.env.VITE_SERVER_API;
                            const imageUrl = product.images.length > 0
                                ? `${baseUrl}${product.images[0].image_url}`
                                : null;

                            return (
                                <div key={product.product_id} className="product-card">
                                    <div className="product-image">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={product.name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                    </div>
                                    <div className="product-details">
                                        <h3>{product.name}</h3>
                                        <p className="sku">SKU: {product.sku_id || 'N/A'}</p>
                                        <div className="rating">
                                            {'★'.repeat(Math.floor(product.rating))}
                                            {'☆'.repeat(5 - Math.floor(product.rating))}
                                            <span>({product.raters})</span>
                                        </div>
                                        {product.offers ? (
                                            <div className="offer-active">
                                                <span className="offer-badge">{product.offers}</span>
                                                <div className="offer-actions">
                                                    <button
                                                        onClick={() => openOfferModal(product, true)}
                                                        className="edit-offer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => removeOffer(product.product_id)}
                                                        className="remove-offer danger"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => openOfferModal(product)}
                                                className="add-offer"
                                            >
                                                Add Offer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-products">
                            <p>No products found matching your search.</p>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="offer-modal">
                            <h2>{isEditing ? 'Edit' : 'Add'} Offer for {selectedProduct?.name}</h2>
                            <div className="modal-content">
                                <div className="input-group">
                                    <label htmlFor="offer">Offer Text:</label>
                                    <textarea
                                        id="offer"
                                        value={offerText}
                                        onChange={handleOfferChange}
                                        placeholder="Enter your offer text (e.g., 'Special discount', 'Limited time offer', etc.)"
                                        rows={4}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button onClick={closeModal} className="cancel-button">
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={saveOffer} 
                                        className="save-button"
                                        disabled={!offerText.trim()}
                                    >
                                        {isEditing ? 'Update Offer' : 'Save Offer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Offers;