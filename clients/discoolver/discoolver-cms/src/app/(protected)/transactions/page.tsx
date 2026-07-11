export default function TransactionsPage() {
  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col justify-center mb-8">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <p className="mt-1 text-muted-foreground">
          Visualiza y gestiona todas las transacciones
        </p>
      </div>

      <div className="flex-1 p-6 rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">
          Contenido de la página de transacciones
        </p>
      </div>
    </div>
  );
}
