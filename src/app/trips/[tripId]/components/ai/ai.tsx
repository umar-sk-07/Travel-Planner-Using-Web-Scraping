'use client';

import { Button } from '@nextui-org/react';
import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';

export default function Ai({ location }: { location: string }) {
  const [responseText, setResponseText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Modal state

  const handleButtonClicked = async () => {
    setLoading(true);
    setError(null);
    setResponseText(null);

const prompt = `As a traveler planning a trip to ${location}, I'm interested in exploring the most iconic and authentic dishes. Could you provide a detailed description of the top culinary delights unique to this destination, along with any cultural or historical significance tied to these dishes? Please elaborate in at least 20 lines.`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to generate a response. Please try again.');
        return;
      }

      // Handle the response as a stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader?.read() || {};
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      // Clean up the result
      const cleanedResponse = cleanUpResponse(result);
      setResponseText(cleanedResponse);
      setIsOpen(true);
    } catch (err) {
      console.error('Error in frontend:', err); // Log the error
      setError('An error occurred while generating the response.');
    } finally {
      setLoading(false);
    }
  };

  // Function to clean up the response
  const cleanUpResponse = (text: string): string => {
    return text
      .replace(/0:/g, '') // Remove instances of "0:"
      .replace(/""/g, '"') // Replace double quotes
      .replace(/\*\*/g, '') // Remove asterisks (for bold formatting)
      .replace(/\\n/g, '\n') // Replace escaped newlines
      .replace(/\n/g, '') // Remove any new line characters
      .trim(); // Trim whitespace from the beginning and end
  };

  // Utility function to convert plain text to ordered list
  const formatAsOrderedList = (text: string | null) => {
    if (!text) return '';
    // Split the text by periods or new lines to create individual items
    const items = text.split(/\.|\n/).filter(item => item.trim() !== ''); // Filter out empty items
    return items.map((item, index) => (
      <li key={index}>{item.trim()}</li>
    ));
  };

  const onClose = () => {
    setIsOpen(false); // Close modal
  };

  return (
    <div>
      <Button
        className="top-0 left-1 w-full rounded-full"
        size="lg"
        color="secondary"
        variant="ghost"
        onClick={handleButtonClicked}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Food Suggestions From AI'}
      </Button>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside" // Enables scrolling for long content
        backdrop="blur" // Optional: adds blur effect to the background
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-red-600">
            AI Suggestions
          </ModalHeader>
          <ModalBody>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {responseText && (
              <ol>
                {formatAsOrderedList(responseText)}
              </ol>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
             color="danger" 
             variant="shadow" 
             onPress={onClose}
             >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}