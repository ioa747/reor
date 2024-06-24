
import React, { useState, useEffect } from "react";

import { Button } from "@material-tailwind/react";
import Slider from "@mui/material/Slider";
import { LLMGenerationParameters } from "electron/main/Store/storeConfig";

interface TextGenerationSettingsProps {}
const TextGenerationSettings: React.FC<TextGenerationSettingsProps> = () => {
  const [textGenerationParams, setTextGenerationParams] =
    useState<LLMGenerationParameters>({
      temperature: 0.7, // Default temperature value
      // maxTokens: 2048, // Default maxTokens value
      // Include other default values as necessary
    });

  const [userHasMadeUpdate, setUserHasMadeUpdate] = useState(false);
  // const [temperature, setTemperature] = useState<number | null>();
  // const [maxTokens, setMaxTokens] = useState<number | null>();

  useEffect(() => {
    const fetchParams = async () => {
      const params = await window.electronStore.getLLMGenerationParams();
      if (params) {
        setTextGenerationParams(params);
      }
    };

    fetchParams();
  }, []);

  const handleSave = () => {
    // Execute the save function here
    if (textGenerationParams) {
      window.electronStore.setLLMGenerationParams(textGenerationParams);
      setUserHasMadeUpdate(false);
    }
  };

  return (
    <div className="w-full bg-neutral-800 rounded pb-7 ">
      <h2 className="text-2xl font-semibold mb-0 text-white">
        Text Generation
      </h2>{" "}
      <p className="mt-2 text-sm text-gray-100 mb-1">Temperature:</p>
      <div className="pl-1 mt-6">
        <Slider
          aria-label="Temperature"
          value={textGenerationParams.temperature}
          valueLabelDisplay="on" // Changed from "auto" to "on" to always show the value label
          step={0.1}
          marks
          min={0}
          max={2}
          onChange={(event, val) => {
            setUserHasMadeUpdate(true);
            const newTemperature = Array.isArray(val) ? val[0] : val;
            setTextGenerationParams({
              ...textGenerationParams,
              temperature: newTemperature,
            });
          }}
          sx={{
            // Targeting the value label component
            "& .MuiSlider-thumb": {
              "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                boxShadow: "none",
              },
              // If you need to remove the ripple effect explicitly
              "&::after": {
                content: "none",
              },
            },
            "& .MuiSlider-valueLabel": {
              fontSize: "0.75rem", // Reduce font size
              padding: "3px 6px", // Adjust padding to make the label smaller
              // You may need to adjust lineHeight if the text is not vertically aligned
              lineHeight: "1.2em",
            },
          }}
        />
      </div>
      <p className="mt-0 text-xs text-gray-100 mb-3">
        Higher temperature means more randomess in generated text.
      </p>
      <p className="mt-2 text-sm text-gray-100 mb-1">Max Tokens:</p>
      <input
        type="text"
        className="block w-full px-3 py-2 border border-gray-300 box-border rounded-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out"
        value={textGenerationParams?.maxTokens}
        onChange={(e) => {
          setUserHasMadeUpdate(true);
          const inputVal = e.target.value;
          let newMaxTokens;

          // Check if the input value is an empty string, set newMaxTokens to undefined.
          if (inputVal === "") {
            newMaxTokens = undefined;
          } else {
            // Parse the input value to an integer and use it if it's a valid number
            const parsedValue = parseInt(inputVal, 10);
            if (!isNaN(parsedValue)) {
              newMaxTokens = parsedValue;
            } else {
              // Optional: handle the case for invalid input that's not empty, e.g., non-numeric characters.
              // For now, we'll just return to avoid setting newMaxTokens to an invalid value.
              return;
            }
          }

          setTextGenerationParams({
            ...textGenerationParams,
            maxTokens: newMaxTokens,
          });
        }}
        // onKeyDown={handleKeyPress}
        placeholder="Maximum tokens to generate"
      />
      <p className="mt-1 text-xs text-gray-100 mb-0">
        Maximum number of tokens to generate.
      </p>
      {userHasMadeUpdate && (
        <div className="flex">
          <Button
            // variant="contained"
            placeholder={""}
            onClick={handleSave}
            className="bg-orange-700 w-[150px] border-none h-8 hover:bg-orange-900 cursor-pointer text-center pt-0 pb-0 pr-2 pl-2 mb-0 mr-4 mt-2"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default TextGenerationSettings;
