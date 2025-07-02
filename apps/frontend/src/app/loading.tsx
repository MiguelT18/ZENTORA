import LoadingIcon from "@/assets/icons/global/LoadingIcon";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-screen bg-light-background dark:bg-dark-background">
      <LoadingIcon className="text-secondary dark:text-primary size-10 mr-2" />
      <p className="text-md text-light-text-secondary dark:text-dark-text-secondary text-center">
        Cargando...
      </p>
    </div>
  );
}
