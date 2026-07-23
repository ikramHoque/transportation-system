import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="centered">
      <h2>Page not found</h2>
      <Link to="/">Go home</Link>
    </div>
  );
}
