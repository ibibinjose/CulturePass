# Description Fields - Rich Text Editor with AI Assistance

This module provides rich text editing capabilities with AI-powered text assistance for the HostSpace Enterprise-Grade Form System.

## Components

### RichTextEditor

A rich text editor with formatting toolbar, character/word count, readability scoring, and AI assistance.

**Features:**
- Rich text formatting (bold, italic, headings, lists)
- Character and word count
- Readability score (Flesch-Kincaid)
- AI assistance integration
- Validation and error display
- Responsive design

**Usage:**

```tsx
import { RichTextEditor } from '@/modules/host/components/fields';

function MyForm() {
  const [description, setDescription] = useState('');

  return (
    <RichTextEditor
      value={description}
      onChange={setDescription}
      label="Description"
      placeholder="Enter a detailed description..."
      maxLength={5000}
      showAIAssist={true}
      showReadabilityScore={true}
      fieldType="description"
      hint="Describe your profile in detail"
    />
  );
}
```

### AIAssistButton

A button that triggers the AI assistance modal.

**Usage:**

```tsx
import { AIAssistButton } from '@/modules/host/components/fields';

function MyComponent() {
  return (
    <AIAssistButton
      onPress={() => setShowModal(true)}
      disabled={!hasText}
      size="medium"
    />
  );
}
```

### AIAssistModal

A modal interface for AI text assistance with multiple operations and tone options.

**Features:**
- Text improvement operations (improve, professional, expand, shorten)
- Tone adjustment (friendly, professional, enthusiastic, formal)
- Result preview with accept/reject/edit actions
- Readability score comparison
- Loading and error states

**Usage:**

```tsx
import { AIAssistModal } from '@/modules/host/components/fields';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');

  return (
    <AIAssistModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      currentText={text}
      onApply={(newText) => {
        setText(newText);
        setShowModal(false);
      }}
      fieldType="description"
    />
  );
}
```

## Hooks

### useAIAssist

A hook that provides AI text assistance functionality.

**Features:**
- Process text with various AI operations
- Calculate readability scores
- Handle loading and error states
- Clear results

**Usage:**

```tsx
import { useAIAssist } from '@/modules/host/hooks/useAIAssist';

function MyComponent() {
  const { isLoading, error, result, processText, clearResult, calculateReadability } = useAIAssist();

  const handleImprove = async () => {
    await processText(currentText, 'improve', 'description');
  };

  const score = calculateReadability(currentText);

  return (
    // Your UI
  );
}
```

## AI Operations

The AI assistance supports the following operations:

1. **improve** - Enhance clarity and flow
2. **professional** - Polish for business context
3. **expand** - Add more detail
4. **shorten** - Make more concise
5. **tone-friendly** - Warm and approachable
6. **tone-professional** - Formal and polished
7. **tone-enthusiastic** - Energetic and exciting
8. **tone-formal** - Traditional and respectful

## Field Types

The components support three field types:

- **tagline** - Short taglines (120 characters max)
- **description** - Long descriptions with rich text
- **guidelines** - Community guidelines with moderation

## Readability Scoring

The Flesch-Kincaid readability score ranges from 0-100:

- **90-100**: Very easy to read
- **60-70**: Standard/conversational
- **0-30**: Very difficult to read

Scores below 60 trigger a suggestion to simplify the text.

## Design System Compliance

All components use CulturePass design tokens:

- **Colors**: `CultureTokens.violet` for AI branding
- **Radius**: `Radius.md` for cards, `Radius.sm` for buttons
- **Typography**: `FontFamily.regular`, `FontFamily.semibold`, `FontFamily.bold`
- **Spacing**: Consistent with design system guidelines

## Requirements Coverage

These components implement:

- **Requirement 5**: AI Copilot Text Assistance
- **Requirement 11**: Rich Text Description and SEO

## Backend Integration

The components require a backend AI service endpoint:

```typescript
POST /api/ai/assist
{
  "text": "Original text",
  "operation": "improve",
  "fieldType": "description"
}

Response:
{
  "suggestedText": "Improved text"
}
```

## Testing

Unit tests are provided for all components and hooks:

- `RichTextEditor.test.tsx` - Component tests
- `useAIAssist.test.ts` - Hook tests

Run tests with:
```bash
npm run test:unit
```

## Accessibility

All components are WCAG 2.1 Level AA compliant:

- Proper `accessibilityLabel` and `accessibilityHint` attributes
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Touch target sizes (44×44 minimum)

## Performance

- Debounced readability calculations
- Optimized re-renders with `useMemo` and `useCallback`
- Lazy loading of AI modal
- Efficient text processing

## Future Enhancements

- [ ] Markdown preview mode
- [ ] Collaborative editing
- [ ] Version history integration
- [ ] Custom AI prompts
- [ ] Grammar and spell checking
- [ ] Multi-language support
