import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { searchUsers } from '../services/users.service';

export default function MentionAutocomplete({ 
  value, 
  onChange, 
  onMention,
  placeholder,
  className = ''
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Detect @ symbol and search
  useEffect(() => {
    const text = value || '';
    const cursorPos = textareaRef.current?.selectionStart || 0;
    
    console.log('MentionAutocomplete: text changed', { text, cursorPos });
    
    // Find @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    console.log('MentionAutocomplete: lastAtIndex', lastAtIndex);
    
    if (lastAtIndex !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      
      console.log('MentionAutocomplete: searchTerm', searchTerm);
      
      // Check if there's a space after @
      if (!searchTerm.includes(' ') && searchTerm.length >= 0) {
        setShowSuggestions(true);
        console.log('MentionAutocomplete: showing suggestions');
        
        // Debounce search
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(async () => {
          if (searchTerm.length > 0) {
            try {
              console.log('MentionAutocomplete: searching users for', searchTerm);
              const users = await searchUsers(searchTerm, 10);
              console.log('MentionAutocomplete: found users', users);
              setSuggestions(users);
              setSelectedIndex(0);
            } catch (error) {
              console.error('MentionAutocomplete: Error searching users:', error);
              setSuggestions([]);
            }
          } else {
            console.log('MentionAutocomplete: search term empty, clearing suggestions');
            setSuggestions([]);
          }
        }, 300);
      } else {
        console.log('MentionAutocomplete: hiding suggestions (space found or invalid)');
        setShowSuggestions(false);
      }
    } else {
      console.log('MentionAutocomplete: hiding suggestions (no @ found)');
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  const handleSelectUser = (user) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const text = value || '';
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Replace @search with @username
    const newText = 
      text.substring(0, lastAtIndex) + 
      `@${user.username} ` + 
      text.substring(cursorPos);
    
    onChange(newText);
    onMention(user);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelectUser(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={4}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 max-h-64 overflow-y-auto z-50">
          {suggestions.map((user, index) => (
            <button
              key={user.id || user._id}
              onClick={() => handleSelectUser(user)}
              className={`w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-indigo-50' : ''
              }`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
