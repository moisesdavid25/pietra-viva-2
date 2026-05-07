import { useEffect } from 'react';

// app.leomenu.it/ → redirige al sitio marketing en leomenu.it
export default function Home() {
  useEffect(() => {
    window.location.replace('https://leomenu.it');
  }, []);
  return null;
}
