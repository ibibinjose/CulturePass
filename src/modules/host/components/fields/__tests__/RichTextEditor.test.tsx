/**
 * RichTextEditor Component Tests
 * 
 * Tests for the rich text editor with AI assistance.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RichTextEditor } from '../RichTextEditor';

describe('RichTextEditor', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <RichTextEditor
        value=""
        onChange={jest.fn()}
        placeholder="Enter description..."
      />
    );

    expect(getByPlaceholderText('Enter description...')).toBeTruthy();
  });

  it('displays character and word count', () => {
    const { getByText } = render(
      <RichTextEditor
        value="Hello world"
        onChange={jest.fn()}
      />
    );

    expect(getByText(/2 words/)).toBeTruthy();
    expect(getByText(/11 characters/)).toBeTruthy();
  });

  it('calls onChange when text is entered', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <RichTextEditor
        value=""
        onChange={onChange}
        placeholder="Enter text..."
      />
    );

    const input = getByPlaceholderText('Enter text...');
    fireEvent.changeText(input, 'New text');

    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('displays label when provided', () => {
    const { getByText } = render(
      <RichTextEditor
        value=""
        onChange={jest.fn()}
        label="Description"
      />
    );

    expect(getByText('Description')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(
      <RichTextEditor
        value=""
        onChange={jest.fn()}
        error="This field is required"
      />
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  it('shows AI assist button when enabled', () => {
    const { getByLabelText } = render(
      <RichTextEditor
        value="Some text"
        onChange={jest.fn()}
        showAIAssist={true}
        label="Description"
      />
    );

    expect(getByLabelText('AI Assist')).toBeTruthy();
  });

  it('displays readability score when enabled', () => {
    const { getByText } = render(
      <RichTextEditor
        value="This is a simple sentence. It is easy to read."
        onChange={jest.fn()}
        showReadabilityScore={true}
      />
    );

    expect(getByText(/Readability:/)).toBeTruthy();
  });

  it('enforces max length', () => {
    const { getByText } = render(
      <RichTextEditor
        value="This is a very long text that exceeds the maximum length"
        onChange={jest.fn()}
        maxLength={20}
      />
    );

    expect(getByText(/\/20 characters/)).toBeTruthy();
  });
});
