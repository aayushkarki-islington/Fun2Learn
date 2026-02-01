from fastapi import HTTPException, status

class UnauthorizedUserException(HTTPException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail or "You are forbidden from modifying this course's contents",
        )

class NotFoundException(HTTPException):
    """
    Common not found exception raised when resources not found.

    Args:
        resource (str): Name of the resource that was not found
            (e.g., "Course", "Question"). Defaults to "Resource".
        detail (str | None): Optional custom error message. If provided,
            it overrides the default "{resource} not found" message.
    """
    def __init__(self, resource: str = "Resource", detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail or f"{resource} not found",
        )

class ExistingResourceException(HTTPException):
    """
    HTTPException for any already existing resource.

    Args:
        resource (str): Name of the resource that is already existing
            (e.g., "Course", "Question"). Defaults to "Resource".
        detail (str | None): Optional custom error message. If provided,
            it overrides the default "{resource} already exists" message.
    """
    def __init__(self, resource: str = "Resource", detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail or f"{resource} already exists"
        )