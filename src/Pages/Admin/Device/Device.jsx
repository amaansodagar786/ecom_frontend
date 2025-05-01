import React, { useState } from 'react';
import axios from 'axios';

const Device = () => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadStatus('');
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/upload-device-transaction',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            setUploadStatus(response.data.message || 'Upload successful!');

        } catch (error) {
            console.error('Upload Error:', error);
            let errorMessage = 'Upload failed.';

            if (error.response) {
                // Backend returned an error response
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response from server. Check your connection.';
            }

            setUploadStatus(errorMessage);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResult(null);
            setUploadStatus('Please enter a Device SR NO or SKU ID');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/search-device',
                { search_term: searchTerm },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            setSearchResult(response.data.data);
            setUploadStatus('');

        } catch (error) {
            console.error('Search Error:', error);
            let errorMessage = 'Search failed.';

            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server. Check your connection.';
            }

            setUploadStatus(errorMessage);
            setSearchResult(null);
        }
    };

    const renderSearchResult = () => {
        if (!searchResult) return null;

        return (
            <div style={styles.resultContainer}>
                <h3>Device: {searchResult.device_name}</h3>
                <p>SR NO: {searchResult.device_srno} | SKU: {searchResult.sku_id}</p>

                {searchResult.status === 'SOLD' && (
                    <div style={styles.resultBox}>
                        <h4>Profit Calculation</h4>
                        <p>IN Price: ₹{searchResult.in_price} (on {searchResult.in_date})</p>
                        <p>OUT Price: ₹{searchResult.out_price} (on {searchResult.out_date})</p>
                        <p style={styles.profitText}>
                            Profit: ₹{searchResult.profit.toFixed(2)}
                        </p>
                    </div>
                )}

                {searchResult.status === 'IN_STOCK' && (
                    <div style={styles.resultBox}>
                        <h4>Current in Stock</h4>
                        <p>IN Price: ₹{searchResult.in_price} (on {searchResult.in_date})</p>
                        <p style={styles.warningText}>{searchResult.message}</p>
                    </div>
                )}

                {searchResult.status === 'SOLD_WITHOUT_IN' && (
                    <div style={styles.resultBox}>
                        <h4>Sold Without IN Record</h4>
                        <p>OUT Price: ₹{searchResult.out_price} (on {searchResult.out_date})</p>
                        <p style={styles.errorText}>{searchResult.message}</p>
                    </div>
                )}

                {searchResult.status === 'RETURN' && (
                    <div style={styles.resultBox}>
                        <h4>Returned Device</h4>
                        <p>Return Date: {searchResult.return_details.date}</p>
                        <p>Remarks: {searchResult.return_details.remarks}</p>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div style={styles.container}>
            <h2>Device Transaction System</h2>

            {/* Search Section */}
            <div style={styles.searchSection}>
                <h3>Search Device</h3>
                <input
                    type="text"
                    placeholder="Enter Device SR NO or SKU ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
                <button style={styles.button} onClick={handleSearch}>
                    Search
                </button>
            </div>

            {renderSearchResult()}

            {/* File Upload Section (keep existing) */}
            <div style={styles.uploadSection}>
                <h3>Upload Transactions</h3>
                <input
                    type="file"
                    accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                />
                <button style={styles.button} onClick={handleUpload}>
                    Upload
                </button>
                {uploadStatus && <p style={styles.statusText}>{uploadStatus}</p>}
            </div>
        </div>
    );
};

const styles = {
    container: {
        margin: '50px auto',
        maxWidth: '800px',
        padding: '20px',
        textAlign: 'center',
    },
    searchSection: {
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
    },
    uploadSection: {
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
    },
    searchInput: {
        padding: '10px',
        width: '300px',
        marginRight: '10px',
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
    },
    resultContainer: {
        margin: '20px 0',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        textAlign: 'left',
    },
    resultBox: {
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    profitText: {
        color: 'green',
        fontWeight: 'bold',
        fontSize: '18px',
    },
    warningText: {
        color: 'orange',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        fontWeight: 'bold',
    },
    statusText: {
        marginTop: '10px',
        color: '#666',
    },
};

export default Device;
