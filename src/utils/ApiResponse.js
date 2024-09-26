class ApiResponse {
    constructor(statusCode, data, message = "success") {
        statusCode < 400 ? this.success = true : this.success = false
        this.statusCode = statusCode
        this.data = data
        this.message = message
       
    }
}

export { ApiResponse }