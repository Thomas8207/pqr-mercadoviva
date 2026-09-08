from datetime import datetime


class Aplicativo:

    def __init__(self, id: str):
        self.id: str = id
        self.fecha: datetime = datetime.now()


class Administrador(Aplicativo):

    def __init__(self, id):
        super().__init__(id)

    def consultar_PQRS(self):
        print("Consultando los PQRS..")

    def supervisar_gestion(self):
        print("Gestionando PQR")

    def responder_cliente(self):
        print("Respondiendo al cliente...")


class Cliente(Aplicativo):

    def __init__(self, id):
        super().__init__(id)

    def registar_PQR(self):
        print("Registrando PQRS..")

    def consultar_estados(self):
        print("Consultando Estados del PQR...")