import React, { useState, useEffect, ReactNode } from "react";

import posthog from "posthog-js";


import CustomSelect from "../Generic/Select";

interface ChunkSizeSettingsProps {
  children?: ReactNode; // Define children prop
}

const ChunkSizeSettings: React.FC<ChunkSizeSettingsProps> = ({ children }) => {
  const [chunkSize, setChunkSize] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const defaultChunkSize = await window.electronStore.getChunkSize();
      if (defaultChunkSize) {
        setChunkSize(defaultChunkSize);
      } else {
        setChunkSize(500); // Default value
        window.electronStore.setChunkSize(500);
      }
    };

    fetchData();
  }, []);

  const handleChangeOnChunkSizeSelect = (size: string) => {
    const numberVersion = parseInt(size);
    setChunkSize(numberVersion);
    window.electronStore.setChunkSize(numberVersion);
    posthog.capture("change_chunk_size", {
      chunkSize: numberVersion,
    });
  };

  const possibleChunkSizes = Array.from(
    { length: 20 },
    (_, i) => (i + 1) * 100
  );

  return (
    <div className="w-full bg-neutral-800 rounded pb-7">
      {children}
      {chunkSize && (
        <CustomSelect
          options={possibleChunkSizes.map((num) => ({
            label: num.toString(),
            value: num.toString(),
          }))}
          selectedValue={chunkSize?.toString()}
          onChange={handleChangeOnChunkSizeSelect}
        />
      )}
    </div>
  );
};

export default ChunkSizeSettings;
