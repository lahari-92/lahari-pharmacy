
let currentTable = 'medicines';
let editingId = null;
let currentRecords = [];

const fields = {
    users: [
        ['name', 'Name', 'text'],
        ['email', 'Email', 'email'],
        ['password', 'Password', 'password'],
        ['phone', 'Phone', 'text'],
        ['role', 'Role', 'select']
    ],
    medicines: [
        ['medicine_name', 'Medicine Name', 'text'],
        ['description', 'Description', 'textarea'],
        ['category', 'Category', 'text'],
        ['manufacturer', 'Manufacturer', 'text'],
        ['price', 'Price', 'number'],
        ['stock', 'Stock', 'number'],
        ['expiry_date', 'Expiry Date', 'date']
    ],
    orders: [
        ['user_id', 'User ID', 'number'],
        ['order_date', 'Order Date', 'date'],
        ['total_amount', 'Total Amount', 'number'],
        ['status', 'Status', 'select']
    ],
    order_items: [
        ['order_id', 'Order ID', 'number'],
        ['medicine_id', 'Medicine ID', 'number'],
        ['quantity', 'Quantity', 'number'],
        ['price', 'Price', 'number']
    ]
};

function createField(field) {
    const [name, label, type] = field;

    const wrapper = document.createElement('div');
    wrapper.className = 'field';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    wrapper.appendChild(labelElement);

    let input;

    if (type === 'textarea') {
        input = document.createElement('textarea');
    } else if (type === 'select') {
        input = document.createElement('select');

        let options = name === 'role'
            ? ['customer', 'admin']
            : ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

        options.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
        });
    } else {
        input = document.createElement('input');
        input.type = type;

        if (type === 'number') {
            input.step = name === 'price' || name === 'total_amount'
                ? '0.01' : '1';
            input.min = '0';
        }
    }

    input.name = name;
    input.id = name;
    input.required = true;

    wrapper.appendChild(input);
    return wrapper;
}

function showTable(table) {
    currentTable = table;
    editingId = null;

    document.getElementById('tableTitle').textContent =
        table.replace('_', ' ').toUpperCase() + ' MANAGEMENT';

    document.getElementById('formFields').replaceChildren();

    fields[table].forEach(field => {
        document.getElementById('formFields')
            .appendChild(createField(field));
    });

    document.getElementById('saveButton').textContent = 'Add Record';

    loadRecords();
}

async function loadRecords() {
    try {
        const response = await fetch('/api/' + currentTable);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        currentRecords = data;
        displayRecords(data);
    } catch (error) {
        alert('Error loading records: ' + error.message);
    }
}

function displayRecords(records) {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');

    head.replaceChildren();
    body.replaceChildren();

    if (records.length === 0) {
        body.textContent = 'No records found.';
        return;
    }

    const headerRow = document.createElement('tr');

    Object.keys(records[0]).forEach(key => {
        if (key === 'password') return;

        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });

    const actionHeader = document.createElement('th');
    actionHeader.textContent = 'Actions';
    headerRow.appendChild(actionHeader);
    head.appendChild(headerRow);

    records.forEach(record => {
        const row = document.createElement('tr');

        Object.keys(record).forEach(key => {
            if (key === 'password') return;

            const td = document.createElement('td');
            td.textContent = record[key] ?? '';
            row.appendChild(td);
        });

        const actionCell = document.createElement('td');

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit';
        editButton.onclick = () => editRecord(record);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
        deleteButton.onclick = () => deleteRecord(record);

        actionCell.append(editButton, deleteButton);
        row.appendChild(actionCell);
        body.appendChild(row);
    });
}

function editRecord(record) {
    const key = {
        users: 'user_id',
        medicines: 'medicine_id',
        orders: 'order_id',
        order_items: 'item_id'
    }[currentTable];

    editingId = record[key];

    fields[currentTable].forEach(([name]) => {
        const input = document.getElementById(name);
        input.value = record[name] ?? '';
    });

    document.getElementById('saveButton').textContent = 'Update Record';

    document.getElementById('dataForm').scrollIntoView({
        behavior: 'smooth'
    });
}

document.getElementById('dataForm').addEventListener('submit', async event => {
    event.preventDefault();

    const record = {};

    fields[currentTable].forEach(([name]) => {
        record[name] = document.getElementById(name).value;
    });

    const url = editingId
        ? `/api/${currentTable}/${editingId}`
        : `/api/${currentTable}`;

    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        alert(result.message);
        resetForm();
        loadRecords();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

async function deleteRecord(record) {
    const key = {
        users: 'user_id',
        medicines: 'medicine_id',
        orders: 'order_id',
        order_items: 'item_id'
    }[currentTable];

    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }

    try {
        const response = await fetch(
            `/api/${currentTable}/${record[key]}`,
            { method: 'DELETE' }
        );

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        alert(result.message);
        loadRecords();
    } catch (error) {
        alert('Delete failed: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('dataForm').reset();
    editingId = null;
    document.getElementById('saveButton').textContent = 'Add Record';
}

showTable('medicines');
