import { Link } from "react-router-dom";

export function Header() {
  const navigation = [
    { name: "Measure", href: "/" },
    { name: "Dyno", href: "/dyno" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <header className="bg-green-600">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-center border-b border-green-500 py-6 lg:border-none">
          <div className="flex items-center">
            <a href="#">
              <span className="sr-only">Race GPS</span>
              <span className="text-4xl">📡</span>
            </a>
            <div className="ml-10 hidden space-x-8 lg:block">
              {navigation.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-base font-medium text-white hover:text-indigo-50"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 py-4 lg:hidden">
          {navigation.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-base font-medium text-white hover:text-indigo-50"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
