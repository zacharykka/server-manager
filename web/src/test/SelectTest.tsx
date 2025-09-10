import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function SelectTest() {
  const [value, setValue] = useState<string>("");

  return (
    <div className="p-4">
      <h1>Select Component Test</h1>
      <p>Testing React DOM attribute warnings fix</p>
      
      <div className="mt-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <p className="mt-2">Selected value: {value || "none"}</p>
    </div>
  );
}