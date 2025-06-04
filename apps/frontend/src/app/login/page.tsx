import Link from "next/link";

export default function Login() {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-2xl font-bold'>Iniciar sesión</h1>
      <p className='text-sm text-gray-500'>
        Ingresa tus datos para iniciar sesión en Zentora
      </p>

      <Link href='/' className='text-blue-500 mt-4 hover:underline transition-all'>
        Ir a la página principal
      </Link>
    </div>
  );
}
