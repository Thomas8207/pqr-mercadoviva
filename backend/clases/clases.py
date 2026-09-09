from datetime import datetime
from Errores.errores import DatosInvalidos400, EstadoInvalido400, TipoPQRInvalido400

class Aplicativo:

    def __init__(self, id: str):
        self.id: str = id
        self.fecha: datetime = datetime.now()


class Administrador(Aplicativo):

    def __init__(self, id):
        super().__init__(id)

    def consultar_PQRS(self, id_pqr):
        if not id_pqr:
            raise DatosInvalidos400()

        print("Consultando PQR...")

    def supervisar_gestion(self, estado):
        estados = ["Pendiente", "En proceso", "Resuelta"]

        if estado not in estados:
            raise EstadoInvalido400()

        print("Supervisando gestión de PQR")

    def responder_cliente(self, respuesta):
        if not respuesta:
            raise DatosInvalidos400()

        print("Respondiendo al cliente")


class Cliente(Aplicativo):

    def __init__(self, id, telefono: str, direccion: str):
        super().__init__(id)

        if not telefono or not direccion:
            raise DatosInvalidos400()

        self.telefono: str = telefono
        self.direccion: str = direccion

    def registar_PQRS(self, tipo):
        tipos = ["Petición", "Queja", "Reclamo", "Sugerencia"]

        if tipo not in tipos:
            raise TipoPQRInvalido400()

        print("PQR registrada correctamente")

    def consultar_PQR(self, id_pqr):
        if not id_pqr:
            raise DatosInvalidos400()

        print("Consultando estado de la PQR")