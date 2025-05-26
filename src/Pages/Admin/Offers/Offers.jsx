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
    const [offerValue, setOfferValue] = useState('');
    const [showModal, setShowModal] = useState(false);
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

    const openOfferModal = (product) => {
        setSelectedProduct(product);
        setOfferValue(product.offers || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setOfferValue('');
    };

    const handleOfferChange = (e) => {
        const value = e.target.value;
        if (value === '' || (value >= 0 && value <= 100)) {
            setOfferValue(value);
        }
    };

    const saveOffer = async () => {
        if (!selectedProduct || offerValue === '') {
            console.warn("Missing selectedProduct or offerValue");
            return;
        }

        try {
            const payload = {
                product_id: selectedProduct.product_id,
                offer_value: offerValue
            };
            console.log("Sending offer update payload:", payload); // ✅ Debug log

            const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/offers/update`, payload);

            console.log("Offer update response:", response.data); // ✅ Debug log

            // Update local state
            const updatedProducts = products.map(product =>
                product.product_id === selectedProduct.product_id
                    ? { ...product, offers: offerValue }
                    : product
            );

            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);
            closeModal();
        } catch (err) {
            console.error("Error updating offer:", err); // ✅ Debug log
            setError(err.message);
        }
    };



    const removeOffer = async (productId) => {
        try {
            const payload = {
                product_id: productId,
                offer_value: null
            };
            console.log("Sending remove offer payload:", payload); // ✅ Debug log

            const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/offers/update`, payload);

            console.log("Remove offer response:", response.data); // ✅ Debug log

            // Update local state
            const updatedProducts = products.map(product =>
                product.product_id === productId
                    ? { ...product, offers: null }
                    : product
            );

            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);
        } catch (err) {
            console.error("Error removing offer:", err); // ✅ Debug log
            setError(err.message);
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

                            console.log(`Product: ${product.name}, Image URL: ${imageUrl || 'No Image'}`); // ✅ Fixed URL

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
                                                <span className="offer-badge">{product.offers}% OFF</span>
                                                <button
                                                    onClick={() => removeOffer(product.product_id)}
                                                    className="remove-offer"
                                                >
                                                    Remove Offer
                                                </button>
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
                            <h2>Add Offer for {selectedProduct?.name}</h2>
                            <div className="modal-content">
                                <div className="input-group">
                                    <label htmlFor="offer">Discount Percentage:</label>
                                    <input
                                        type="number"
                                        id="offer"
                                        min="0"
                                        max="100"
                                        value={offerValue}
                                        onChange={handleOfferChange}
                                        placeholder="Enter percentage (0-100)"
                                    />
                                    <span>%</span>
                                </div>
                                <div className="modal-actions">
                                    <button onClick={closeModal} className="cancel-button">
                                        Cancel
                                    </button>
                                    <button onClick={saveOffer} className="save-button">
                                        Save Offer
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