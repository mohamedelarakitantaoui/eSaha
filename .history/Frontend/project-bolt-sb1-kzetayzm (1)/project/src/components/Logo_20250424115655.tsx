import logoImage from '../assets/images/logo.png';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src={logoImage} alt="eSaha Logo" className="h-8 w-8" />
      <span className="text-2xl font-bold text-indigo-600">ESAHA</span>
    </div>
  );
}
