import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold">Sistema de Autenticación</h1>
      <p className="text-lg my-4 text-text-secondary dark:text-text-secondary-dark">
        Bienvenido a nuestro sistema de login y registro
      </p>

      <div className="flex gap-4 items-center">
        <Link href="/user/login" className="text-white bg-primary hover:bg-primary/90 transition-colors p-2 rounded-md text-md tracking-wider font-roboto">
          Iniciar Sesión
        </Link>
        <Link href="/user/register" className="border-surface border p-2 rounded-md hover:bg-surface transition-colors dark:border-surface-dark dark:hover:bg-surface-dark font-roboto tracking-wider">
          Registrarse
        </Link>
      </div>
    </div>
  );
}
