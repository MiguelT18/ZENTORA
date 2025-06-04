import Link from "next/link";

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1>ZENTORA APP</h1>
      <p>Bienvenido a Zentora</p>

      <div className='flex gap-4 mt-4'>
        <Link
          href='/register'
          className='bg-blue-500 text-white px-4 py-2 rounded-md'
        >
          Crear una cuenta
        </Link>
        <Link
          href='/login'
          className='bg-blue-500 text-white px-4 py-2 rounded-md'
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
