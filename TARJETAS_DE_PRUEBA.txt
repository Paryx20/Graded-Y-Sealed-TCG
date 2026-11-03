GRADED & SEALED TCG - TARJETAS DE PRUEBA PARA LA DEMOSTRACION
================================================================

Estas tarjetas son ficticias: solo sirven para simular la respuesta del banco
en el checkout (no se cobra nada real). La lista ya no se muestra en la pagina,
asi que usa este bloc de notas durante la presentacion.

Para todas: nombre del titular cualquiera (ej. CARLOS MENDOZA),
fecha de expiracion futura (ej. 12/30) y CVV de 3 digitos (ej. 123).


TARJETAS APROBADAS
------------------
[ ] 4111 1111 1111 1111  -> Aprobada (Visa)
[ ] 4242 4242 4242 4242  -> Aprobada (Visa)
[ ] 5555 5555 5555 4444  -> Aprobada (Mastercard)


TARJETAS RECHAZADAS (cada una muestra un error distinto)
--------------------------------------------------------
[ ] 4000 0000 0000 0002  -> Tarjeta inexistente o cancelada   (NO-EXISTE-14)
[ ] 4000 0000 0000 0069  -> Tarjeta caducada segun el banco   (EXPIRADA-54)
[ ] 4000 0000 0000 9995  -> Fondos insuficientes              (FONDOS-51)
[ ] 4100 0000 0000 0019  -> Tarjeta bloqueada (robo/extravio) (BLOQUEADA-43)
[ ] 4000 0000 0000 0127  -> CVV incorrecto                    (CVV-82)


OTRAS VALIDACIONES PARA PROBAR
------------------------------
[ ] Fecha pasada (ej. 09/24)           -> Error: tarjeta caducada
[ ] Numero que no pasa Luhn (ej. 4111 1111 1111 1112) -> Error: numero invalido
[ ] Retiro en Local Fisico + Efectivo   -> Orden reservada, pago en ventanilla


Las reglas estan en js/validators.js (TEST_CARDS).
