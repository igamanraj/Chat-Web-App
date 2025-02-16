import React, { useState, useEffect } from "react";
import { HiOutlineGif } from "react-icons/hi2";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { Tooltip } from "react-tooltip";
import { IoSearchOutline } from "react-icons/io5";

const GifPicker = ({ onGifSelect }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const gf = new GiphyFetch("5u7XFd6vukoEzM51soNHG4miff6FmmS1");

  // Function to fetch GIFs based on search term
  const fetchGifs = async (offset) => {
    try {
      return searchTerm
        ? gf.search(searchTerm, { offset, limit: 10 })
        : gf.trending({ offset, limit: 10 });
    } catch (err) {
      console.error('Error fetching GIFs:', err);
      setError('Failed to load GIFs');
      return { data: [] }; // Return empty data on error
    }
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPicker && 
        !event.target.closest('.gif-picker-container') && 
        !event.target.closest('[data-tooltip-id="gif-tooltip"]')
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPicker]);

  return (
    <div className="relative inline-block">
      {/* GIF Button */}
      <button
        onClick={() => setShowPicker((prev) => !prev)}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-400 transition-colors flex items-center justify-center h-[35px]"
        data-tooltip-id="gif-tooltip"
      >
        <HiOutlineGif size={22} className="relative -top-[5px]" />
        <Tooltip id="gif-tooltip" place="top" content="Add GIF" />
      </button>

      {/* GIF Picker */}
      {showPicker && (
        <div 
          className="absolute bottom-[50px] right-0 z-50 bg-gray-800 rounded-lg shadow-lg w-[320px] h-[400px] overflow-hidden gif-picker-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-gray-800 p-3 border-b border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none   "
              />
              <IoSearchOutline 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                size={16}
              />
            </div>
          </div>
          
          {/* GIFs Grid */}
          <div className="h-[calc(100%-64px)] overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="p-2">
              {error ? (
                <div className="text-red-400 text-center py-4">{error}</div>
              ) : (
                <Grid
                  width={300}
                  columns={2}
                  fetchGifs={fetchGifs}
                  onGifClick={(gif) => {
                    onGifSelect(gif.images.original.url);
                    setShowPicker(false);
                  }}
                  noLink={true}
                  hideAttribution={true}
                  key={searchTerm} // Force refresh when search changes
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GifPicker;
