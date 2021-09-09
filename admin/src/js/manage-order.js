$(document).ready(() => {
    // khai bao order
    const G_COLUMN_ACTION = 8;
    const G_ORDER_DETAIL_COLUMN = 0;
    let gOrderTable = $('#table-order').DataTable({
        columns: [
            { data: 'id' },
            { data: 'fullName' },
            { data: 'phoneNumber' },
            { data: 'comments' },
            { data: 'orderDate' },
            { data: 'requiredDate' },
            { data: 'shippedDate' },
            { data: 'status' },
            { data: 'Action' },
        ],
        columnDefs: [
            {
                targets: G_ORDER_DETAIL_COLUMN,
                render: (orderId) =>
                    `<a href="order-detail.html?orderId=${orderId}">Detail Order ${orderId}</a>`,
            },
            {
                targets: G_COLUMN_ACTION,
                defaultContent: `<i class="text-primary far fa-edit"></i>`,
            },
        ],
    });

    // khai bao bien
    let gOrderId = 0;
    let gCustomerId = 0;

    getOrderData();
    getCustomerData();

    // add even listener
    $('#s-customer').change((e) => (gCustomerId = e.target.value));
    $('#btn-create-order').click(onCreateOrderClick);
    $('#table-order').on('click', '.fa-edit', onUpdateOrderClick);
    $('#btn-save-order').click(onSaveOrderClick);

    // save order
    function onSaveOrderClick() {
        let vNewOrder = {
            orderDate: $('#inp-order-date').val().trim(),
            requiredDate: $('#inp-required-date').val().trim(),
            shippedDate: $('#inp-shipped-date').val().trim(),
            status: $('#inp-status').val().trim(),
            comments: $('#inp-message').val().trim(),
        };
        if (validateOrder(vNewOrder)) {
            if (gOrderId == 0) {
                createNewOrder(vNewOrder);
            } else {
                updateOrderById(vNewOrder);
            }
        }
    }

    // create new order
    function createNewOrder(paramOrder) {
        $.ajax({
            url: `http://localhost:8080/api/customers/${gCustomerId}/orders`,
            method: 'post',
            data: JSON.stringify(paramOrder),
            contentType: 'application/json ; charset=utf-8',
            success: (response) => {
                alert(`Đã tạo mới thành công order ${response.id}`);
                $('#modal-update-order').modal('hide');
                window.location.href = `add-product.html?orderId=${response.id}`;
            },
            error: (e) => alert(e.responseText),
        });
    }

    // update order
    function updateOrderById(paramOrder) {
        $.ajax({
            url: `http://localhost:8080/api/orders/${gOrderId}`,
            method: 'put',
            data: JSON.stringify(paramOrder),
            contentType: 'application/json ; charset=utf-8',
            success: () => {
                alert(`Đã cập nhật thành công order`);
                $('#modal-update-order').modal('hide');
                getOrderData();
            },
            error: (e) => alert(e.responseText),
        });
    }

    // validate order
    function validateOrder(paramOrder) {
        let vResult = true;
        try {
            if (paramOrder.orderDate == '') {
                vResult = false;
                throw '100. Ngày đặt hàng không được để trống';
            }
            if (paramOrder.requiredDate == '') {
                vResult = false;
                throw '101. Ngày nhận hàng không được để trống';
            }
            if (gOrderId == 0) {
                if (gCustomerId == 0) {
                    vResult = false;
                    throw '200. Chọn khách hàng để lên đơn hàng';
                }
            }
        } catch (error) {
            $('#modal-error').modal('show');
            $('#error').text(error);
        }
        return vResult;
    }

    // create order click
    function onCreateOrderClick() {
        gOrderId = 0;
        $('#modal-update-order').modal('show');
        resetInput();
        $('#s-customer').prop('disabled', false);
    }

    // update order click
    function onUpdateOrderClick() {
        let vSelectedRow = $(this).parents('tr');
        let vSelectedData = gOrderTable.row(vSelectedRow).data();
        gOrderId = vSelectedData.id;
        $('#s-customer').prop('disabled', true);
        $('#modal-update-order').modal('show');
        $.get(`http://localhost:8080/api/orders/${gOrderId}`, loadOrderToInput);
    }

    // load order to input
    function loadOrderToInput(paramOrder) {
        $('#inp-order-date').val(paramOrder.orderDate);
        $('#inp-required-date').val(paramOrder.requiredDate);
        $('#inp-shipped-date').val(paramOrder.shippedDate);
        $('#inp-status').val(paramOrder.status);
        $('#inp-message').val(paramOrder.comments);
    }

    // reset input
    function resetInput() {
        $('#s-customer').val(0);
        $('#inp-order-date').val('');
        $('#inp-required-date').val('');
        $('#inp-shipped-date').val('');
        $('#inp-status').val('');
        $('#inp-message').val('');
    }

    // render order
    function renderOrderToTable(paramOrder) {
        gOrderTable.clear();
        gOrderTable.rows.add(paramOrder);
        gOrderTable.draw();
    }

    // get order
    function getOrderData() {
        $.ajax({
            url: `http://localhost:8080/api/customers/orders`,
            method: 'GET',
            dataType: 'json',
            success: renderOrderToTable,
            error: (e) => alert(e.responseText),
        });
    }

    // get customer
    function getCustomerData() {
        $.ajax({
            url: `http://localhost:8080/api/customers`,
            method: 'GET',
            dataType: 'json',
            success: renderToSelect,
            error: (e) => alert(e.responseText),
        });
    }

    function renderToSelect(paramCustomer) {
        let vSelectElement = $('#s-customer');
        paramCustomer.forEach((customer) => {
            $('<option>', {
                text: `${customer.firstName} ${customer.lastName}`,
                value: customer.id,
            }).appendTo(vSelectElement);
        });
    }

    // signout
    const userCookie = getCookie('user');
    var urlInfo = 'http://42.115.221.44:8080/devcamp-auth/users/me';

    $.ajax({
        url: urlInfo,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + userCookie },
        success: function (responseObject) {
            displayUser(responseObject);
        },
        error: function (xhr) {
            console.log(xhr);
            // Khi token hết hạn, AJAX sẽ trả về lỗi khi đó sẽ redirect về trang login để người dùng đăng nhập lại
            redirectToLogin();
        },
    });

    function displayUser(paramUser) {}

    function redirectToLogin() {
        // Trước khi logout cần xóa token đã lưu trong cookie
        setCookie('user', '', 1);
        window.location.href = 'signIn.html';
    }

    $('#btn-log-out').click(redirectToLogin);

    function getCookie(cname) {
        let name = cname + '=';
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    }
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
        var expires = 'expires=' + d.toUTCString();
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }
});
