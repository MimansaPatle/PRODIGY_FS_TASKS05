import { useNavigate } from 'react-router-dom';

export default function ClickableHashtags({ text }) {
  const navigate = useNavigate();

  if (!text) return null;

  // Split text by hashtags and mentions
  const parts = text.split(/(\#\w+|\@\w+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          // Hashtag
          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/hashtag/${part.substring(1)}`);
              }}
              className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-semibold"
            >
              {part}
            </span>
          );
        } else if (part.startsWith('@')) {
          // Mention (can be implemented later)
          return (
            <span
              key={index}
              className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-semibold"
            >
              {part}
            </span>
          );
        } else {
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
}
