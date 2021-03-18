class YodaError(Exception):
    pass

class UnauthorizedAPIAccessError(YodaError):
    pass

class MissingDataError(YodaError):
    pass
