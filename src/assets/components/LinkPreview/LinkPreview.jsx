import React, { useState, useEffect } from 'react';
import './LinkPreview.css';
import { FaLink } from 'react-icons/fa'; // Import link icon

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(
          `https://api.microlink.io?url=${encodeURIComponent(url)}`
        );
        const { data } = await response.json();
        
        setPreview({
          title: data.title,
          description: data.description,
          image: data.image?.url,
          domain: new URL(url).hostname,
          favicon: data.logo?.url
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching link preview:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading || error || !preview) {
    return (
      <div className="link-preview-loading">
        <FaLink className="link-icon" />
        <span className="link-url">{url}</span>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview-wrapper">
      <div className="link-preview">
        <div className="preview-content">
          <div className="preview-site">
            {preview.favicon ? (
              <img src={preview.favicon} alt="" className="site-favicon" />
            ) : (
              <FaLink className="link-icon" />
            )}
            <span className="site-domain">{preview.domain}</span>
          </div>
          <h4 className="preview-title">{preview.title}</h4>
          {preview.description && (
            <p className="preview-description">{preview.description}</p>
          )}
        </div>
        {preview.image && (
          <div className="preview-image">
            <img src={preview.image} alt={preview.title || 'Link preview'} />
          </div>
        )}
      </div>
    </a>
  );
};

export default LinkPreview; 