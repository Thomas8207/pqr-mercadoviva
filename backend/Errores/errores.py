
class DatosInvalidos400(Exception):
    """
    Excepcion para indicar que los datos son faltantes
    o estan mal formateados.
    """

    def __init__(self):
        super().__init__("Los datos son faltantes o estan mal formateados")


class TipoPQRInvalido400(Exception):
    """
    Excepcion para indicar que el tipo de PQR no es valido.
    """

    def __init__(self):
        super().__init__("El tipo de PQR no es valido")


class EstadoInvalido400(Exception):
    """
    Excepcion para indicar que el estado de la PQR no es valido.
    """

    def __init__(self):
        super().__init__("El estado de la PQR no es valido")


class PQRNoEncontrada404(Exception):
    """
    Excepcion para indicar que la PQR no existe.
    """

    def __init__(self):
        super().__init__("PQR no encontrada")


class ErrorBaseDatos500(Exception):
    """
    Excepcion para indicar un error inesperado en la base de datos.
    """

    def __init__(self):
        super().__init__("Error interno del servidor")
