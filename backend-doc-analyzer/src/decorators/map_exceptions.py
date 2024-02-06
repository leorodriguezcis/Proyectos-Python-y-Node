from functools import wraps


_METADATA_KEY = "_exceptions_mapped"


def map_exceptions(target_exception: Exception):
    def wrapper(cls):
        for name, method in cls.__dict__.items():
            if hasattr(method, _METADATA_KEY) and method._exceptions_mapped:
                setattr(cls, name, _map_to_exception(method, target_exception))
        return cls

    return wrapper


def exceptions_mapped(func):
    setattr(func, _METADATA_KEY, True)
    return func


def _map_to_exception(func, target_exception: Exception):
    @wraps(func)
    def map_exceptions(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as exception:
            print(exception)
            raise target_exception

    return map_exceptions
