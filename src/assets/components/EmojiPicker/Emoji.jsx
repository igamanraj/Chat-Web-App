import React from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { MdEmojiEmotions } from "react-icons/md";
import { Tooltip } from "react-tooltip";

const EmojiPicker = ({ onEmojiSelect, showPicker, togglePicker }) => {
  return (
    <>
      {/* Emoji Picker Button */}
      <button
        onClick={togglePicker}
        className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-400 transition-colors flex items-center"
        data-tooltip-id="emoji-tooltip"
      >
        <MdEmojiEmotions size={22} className="mt-[1px]" />
        <Tooltip id="emoji-tooltip" place="top" content="Add Emoji" />
      </button>

      {/* Emoji Mart Picker */}
      {showPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <div
            onClick={(e) => e.stopPropagation()}
            className="emoji-picker-container"
          >
            <Picker
              data={data}
              onEmojiSelect={onEmojiSelect}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
              searchPosition="Sticky"
              navPosition="Top"
              perLine={8}
              maxFrequentRows={0}
              emojiSize={20}
              emojiButtonSize={28}
              categories={[
                "people",
                "nature",
                "foods",
                "activity",
                "places",
                "objects",
                "symbols",
                "flags",
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EmojiPicker;
