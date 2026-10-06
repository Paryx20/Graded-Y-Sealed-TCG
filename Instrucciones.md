Actúa como Senior Frontend Developer. Aplica las siguientes 5 correcciones técnicas de usabilidad y validación en la aplicación web de "Graded & Sealed TCG":

1. Sincronización Reactiva de Contenedores de Entrega (Radio Buttons):
   - Corrige el error de estilos donde el contenedor de "Envío a Domicilio" mantiene el borde rojo/activo a pesar de haber seleccionado "Retiro en Local Físico".
   - Al cambiar la selección entre los radios de entrega, ejecuta una función que limpie las clases de borde activo (`border-red-600`, `border-2`, `bg-red-50/20`) de todos los contenedores padre y aplique el borde activo exclusivamente al contenedor cuyo input esté `:checked`. El contenedor deseleccionado debe volver a su borde neutro (`border-gray-200`).

2. Variabilidad Realista en Historial de Mercado (Tendencias Negativas):
   - Modifica el dataset del módulo "Historial de Mercado Actual" para que refleje caídas de precio reales según la condición:
     * Para 'Raw / NM' o 'PSA 8': Muestra un porcentaje negativo (ej. "-4.8%" o "-12.3%"), asigna clases semánticas de color rojo (`text-red-700 bg-red-100`) al badge y renderiza la curva SVG en color rojo (#DC2626) con trayectoria descendente hacia el final.
     * Para 'PSA 10 GEM MT': Mantén la tendencia positiva alcista ("+21.7%") en verde (#16A34A).

3. Eliminación del Checkbox de Simulación Manual:
   - Remueve completamente del DOM del Checkout el checkbox y la etiqueta "Simular fallo bancario".
   - Mantén la simulación de contingencia bancaria (#DECLINED-SEC-054) gobernada estrictamente por lógica en JavaScript: si el número de tarjeta ingresado termina en '0000', dispara la vista de error tras la animación de carga; de lo contrario, procede a la confirmación exitosa.

4. Formato de Teléfono Ecuatoriano (+593):
   - Limpia cualquier número quemado en duro en el campo de teléfono.
   - Implementa un grupo de entrada con prefijo visual fijo no editable "+593" a la izquierda y un input numérico a la derecha con placeholder limpio "099 123 4567".
   - Limita la entrada a un máximo de 9 o 10 dígitos numéricos (`maxlength="10"`), bloqueando caracteres no numéricos en el evento `input`.

5. Validación Algorítmica de Cédula Ecuatoriana (Módulo 10):
   - Agrega validación en tiempo real para el campo Cédula/RUC:
     * Restringe el campo para admitir únicamente números y una longitud exacta de 10 dígitos.
     * Implementa el algoritmo de validación ecuatoriano (código de provincia entre 01 y 24, tercer dígito menor a 6, y verificación de dígito verificador mediante Módulo 10).
     * Si el usuario ingresa menos de 10 dígitos, excede el límite o el algoritmo falla, despliega un mensaje accesible en rojo debajo del campo: "Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)" y resalta el borde en rojo.
     * Bloquea el envío del formulario de checkout si la cédula no es válida.