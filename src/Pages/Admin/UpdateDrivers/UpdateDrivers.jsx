import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import { FiUpload, FiEdit, FiTrash2, FiPlus, FiFile, FiSearch } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UpdateDrivers.scss';

const UpdateDrivers = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileModal, setFileModal] = useState(false);
    const [fileType, setFileType] = useState('document');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`
                    }
                });
                setProducts(response.data);
                setFilteredProducts(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch products');
                setLoading(false);
                toast.error('Failed to fetch products');
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const results = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

    const getAuthToken = () => {
        return localStorage.getItem('token') || '';
    };

    const handleAddFile = (product) => {
        setSelectedProduct(product);
        setSelectedFile(null);
        setFileModal(true);
    };

    const handleEditFile = (product, file) => {
        setSelectedProduct(product);
        setSelectedFile(file);
        setFileType(file.file_type);
        setFileModal(true);
    };

    const handleDeleteFile = async (fileId) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_SERVER_API}/product/files/${fileId}`, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`
                    }
                });
                setProducts(products.map(product => ({
                    ...product,
                    files: product.files.filter(f => f.file_id !== fileId)
                })));
                toast.success('File deleted successfully');
                window.location.reload();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete file');
                toast.error('Failed to delete file');
            }
        }
    };

    const handleFileSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (fileToUpload) formData.append('file', fileToUpload);
        formData.append('file_type', fileType);

        try {
            if (selectedFile) {
                // Update existing file
                const response = await axios.put(
                    `${import.meta.env.VITE_SERVER_API}/product/files/${selectedFile.file_id}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${getAuthToken()}`
                        }
                    }
                );

                setProducts(products.map(product => {
                    if (product.product_id !== selectedProduct.product_id) return product;
                    return {
                        ...product,
                        files: product.files.map(f =>
                            f.file_id === selectedFile.file_id ? response.data : f
                        )
                    };
                }));
                toast.success('File updated successfully');
            } else {
                // Add new file
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_API}/product/${selectedProduct.product_id}/files`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${getAuthToken()}`
                        }
                    }
                );

                setProducts(products.map(product => {
                    if (product.product_id !== selectedProduct.product_id) return product;
                    return {
                        ...product,
                        files: [...product.files, response.data]
                    };
                }));
                toast.success('File added successfully');
            }

            setFileModal(false);
            setFileToUpload(null);
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'File operation failed');
            toast.error('File operation failed');
        }
    };

    if (loading) return <AdminLayout><div className="loading-spinner">Loading...</div></AdminLayout>;
    if (error) return <AdminLayout><div className="error-message">{error}</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="product-files-container">
                <h1>Product Files Management</h1>

                <div className="search-bar">
                    <div className="search-input">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search products by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.product_id} className="product-card">
                            <div className="product-header">
                                {product.images?.length > 0 && (
                                    <img
                                        src={`${import.meta.env.VITE_SERVER_API}${product.images[0].image_url}`}
                                        alt={product.name}
                                        className="product-image"
                                    />
                                )}
                                <h3>{product.name}</h3>
                                <p className="sku">SKU: {product.sku_id}</p>
                            </div>

                            <div className="files-section">
                                <div className="section-header">
                                    <h4>Files</h4>
                                    <button
                                        onClick={() => handleAddFile(product)}
                                        className="add-file-btn"
                                    >
                                        <FiPlus /> Add File
                                    </button>
                                </div>

                                {product.files?.length === 0 ? (
                                    <div className="no-files">No files added yet</div>
                                ) : (
                                    <div className="files-list">
                                        {product.files.map(file => (
                                            <div key={file.file_id} className="file-item">
                                                <div className="file-info">
                                                    <FiFile className="file-icon" />
                                                    <div>
                                                        <div className="file-name">{file.original_filename}</div>
                                                        <div className="file-meta">
                                                            {/* <span className="file-type">{file.file_type}</span> */}
                                                            {/* <span className="file-date">
                                                                {new Date(file.created_at).toLocaleDateString()}
                                                            </span> */}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="file-actions">
                                                    <button
                                                        onClick={() => handleEditFile(product, file)}
                                                        className="edit-btn"
                                                    >
                                                        <FiEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFile(file.file_id)}
                                                        className="delete-btn"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* File Modal */}
                {fileModal && (
                    <div className="modal-overlay">
                        <div className="file-modal">
                            <h3>
                                {selectedFile ? 'Update File' : 'Add New File'}
                                <button onClick={() => setFileModal(false)} className="close-btn">
                                    &times;
                                </button>
                            </h3>

                            <form onSubmit={handleFileSubmit}>
                                <div className="form-group">
                                    <label>File Type</label>
                                    <select
                                        value={fileType}
                                        onChange={(e) => setFileType(e.target.value)}
                                        required
                                    >
                                        <option value="document">Document</option>
                                        <option value="manual">Manual</option>
                                        <option value="spec_sheet">Spec Sheet</option>
                                        <option value="certificate">Certificate</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        {selectedFile ? 'Replace File (leave blank to keep current)' : 'Select File'}
                                    </label>
                                    <div className="file-upload">
                                        <label className="upload-btn">
                                            <FiUpload /> Choose File
                                            <input
                                                type="file"
                                                onChange={(e) => setFileToUpload(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        {fileToUpload ? (
                                            <span className="file-name">{fileToUpload.name}</span>
                                        ) : selectedFile ? (
                                            <span className="file-name">Current: {selectedFile.original_filename}</span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setFileModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary">
                                        {selectedFile ? 'Update File' : 'Add File'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <ToastContainer
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    toastStyle={{
                        borderRadius: '12px',
                        fontFamily: "'Inter', sans-serif"
                    }}
                />
            </div>
        </AdminLayout>
    );
};

export default UpdateDrivers;