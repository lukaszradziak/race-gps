import { Link, Outlet } from "react-router-dom";

export function Root() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to={`/`}>Measure</Link>
          </li>
          <li>
            <Link to={`/dyno`}>Dyno</Link>
          </li>
          <li>
            <Link to={`/settings`}>Settings</Link>
          </li>
        </ul>
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
