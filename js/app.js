let DB;

// Selectores de la Interfaz
const form = document.querySelector('form'),
    nombreMascota = document.querySelector('#mascota'),
    nombreCliente = document.querySelector('#cliente'),
    telefono = document.querySelector('#telefono'),
    fecha = document.querySelector('#fecha'),
    hora = document.querySelector('#hora'),
    sintomas = document.querySelector('#sintomas'),
    citas = document.querySelector('#citas'),
    headingAdministra = document.querySelector('#administra');

// Esperar por el DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Crear la base de datos
    let crearDB = window.indexedDB.open('citas', 1);

    // Si hay un error enviarlo a la consola
    crearDB.onerror = function() {
            console.log('Hubo un error');
        }
        // Si todo esta bien entonces mostrar en consola y asignar la base de datos
    crearDB.onsuccess = function() {
        //console.log('Todo listo');

        // Asignar a la base de datos
        DB = crearDB.result;
        //console.log(DB);

        mostrarCitas();
    }

    // Este método solo corre una vez y es ideal para crear el Schema de la DB
    crearDB.onupgradeneeded = function(e) {
            // El evento es la misma base de datos
            let db = e.target.result;

            // Definir el objectstore, toma 2 parametros, el nombre de la base de datos y las opciones
            // KeyPath es el indice de la base de datos
            // Las opciones se pasan como objeto
            let objectStore = db.createObjectStore('citas', { keyPath: 'key', autoIncrement: true }); // Similar a como si fuese una base de datos de SQL

            // Crear los indices y campos de la base de datos, createIndex: 3 parametros, nombre, kayPath y opciones
            objectStore.createIndex('mascota', 'mascota', { unique: false });
            objectStore.createIndex('cliente', 'cliente', { unique: false });
            objectStore.createIndex('telefono', 'telefono', { unique: false });
            objectStore.createIndex('fecha', 'fecha', { unique: false });
            objectStore.createIndex('hora', 'hora', { unique: false });
            objectStore.createIndex('sintomas', 'sintomas', { unique: false });

            console.log('Base de datos creada y lista');
        }
        // Cuando el formulario se envia
    form.addEventListener('submit', agregarDatos);

    function agregarDatos(e) {
        e.preventDefault();

        const nuevaCita = {
            mascota: nombreMascota.value,
            cliente: nombreCliente.value,
            telefono: telefono.value,
            fecha: fecha.value,
            hora: hora.value,
            sintomas: sintomas.value
        }

        // En IndexedDB se utilizan las transacciones
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
        let peticion = objectStore.add(nuevaCita);

        console.log(peticion);

        peticion.onsuccess = () => form.reset();
        transaction.oncomplete = () => {
            console.log('Cita agregada');
            mostrarCitas();
        }
        transaction.onerror = () => console.log('Hubo un error!');
    }

    function mostrarCitas() {
        // Limpiar las citas anteriores en caso de que haya
        while (citas.firstChild) {
            citas.removeChild(citas.firstChild);
        }

        // Creamos un objectStore
        let objectStore = DB.transaction('citas').objectStore('citas');

        // Esto retorna una petición
        objectStore.openCursor().onsuccess = (e) => {
            // Cursor se va a ubicar en el registro indicado para acceder a los datos
            let cursor = e.target.result;
            // Comprobar que exista un cursor
            if (cursor) {
                let citaHTML = document.createElement('li');
                // data-cita-id es un atributo personalizado de esos que ya podemos crear en 
                // HTML5 que inician con data y luego poner un cita-id para saber que id fue presionado
                // cuando quiera eliminar las citas
                citaHTML.setAttribute('data-cita-id', cursor.value.key);
                // list-group-item es una clase de bootstrap que le va a dar un buen estilo
                citaHTML.classList.add('list-group-item');
                citaHTML.innerHTML = `
                    <p class="font-weight-bold">Mascota: <span class="font-weight-normal">${cursor.value.mascota}</span></p>
                    <p class="font-weight-bold">Cliente: <span class="font-weight-normal">${cursor.value.cliente}</span></p>
                    <p class="font-weight-bold">Teléfono: <span class="font-weight-normal">${cursor.value.telefono}</span></p>
                    <p class="font-weight-bold">Fecha: <span class="font-weight-normal">${cursor.value.fecha}</span></p>
                    <p class="font-weight-bold">Hora: <span class="font-weight-normal">${cursor.value.hora}</span></p>
                    <p class="font-weight-bold">Sintomas: <span class="font-weight-normal">${cursor.value.sintomas}</span></p>
                `;
                // Botono de borrar
                const botonBorrar = document.createElement('button');
                botonBorrar.classList.add('borrar', 'btn', 'btn-danger');
                botonBorrar.innerHTML = `<span aria-hidden="true">X</span> Borrar`;
                botonBorrar.onclick = borrarCita;
                citaHTML.appendChild(botonBorrar);

                // append en el padre
                citas.appendChild(citaHTML);
                // Una vez que terminamos tenemos que decirle que continue por si en caso de
                // que tenga mas registros no se quede en el primero, sino que
                // continue al segundo, al tercero y asi suscesivamente
                // Consulta los proximos registros
                cursor.continue();
            } else if (!citas.firstChild) {
                // Cuando no hay registros
                headingAdministra.textContent = 'Agrega citas para comenzar';
                let listado = document.createElement('p');
                listado.classList.add('text-center');
                listado.textContent = 'No hay registros';
                citas.appendChild(listado);
            } else {
                headingAdministra.textContent = 'Administra tus citas';
            }
        }
    }

    function borrarCita(e) {
        let citaID = Number(e.target.parentElement.getAttribute('data-cita-id'));

        // En IndexedDB se utilizan las transacciones
        let transaction = DB.transaction(['citas'], 'readwrite');
        let objectStore = transaction.objectStore('citas');
        let peticion = objectStore.delete(citaID);

        transaction.oncomplete = () => {
            e.target.parentElement.parentElement.removeChild(e.target.parentElement);

            if (!citas.firstChild) {
                // Cuando no hay registros
                headingAdministra.textContent = 'Agrega citas para comenzar';
                let listado = document.createElement('p');
                listado.classList.add('text-center');
                listado.textContent = 'No hay registros';
                citas.appendChild(listado);
            } else {
                headingAdministra.textContent = 'Administra tus citas';
            }
        }
    }
})