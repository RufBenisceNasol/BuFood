import { Link } from 'react-router-dom';
import './ChatStyles.css';

export default function ChatFloatingButton({ count = 0 }) {
  return (
    <Link to="/seller/chat" className="dlb-fab" aria-label="Messages">
      <span role="img" aria-label="chat">💬</span>
      {count > 0 && <span className="dlb-fab-badge">{count}</span>}
    </Link>
  );
}
