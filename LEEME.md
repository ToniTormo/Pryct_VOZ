# Pryct_VOZ

Hola! 

En tus manos dejamos nuestro proyecto de la asignatura de Voz. 

Primeramente, te explicaremos de forma breve cómo puedes inicializarlo. 

**Para probar nuestro proyecto solo tienes que abrir tu navegador y arrastrar el HTML dentro.**
Y ya está. Fácil y sencillo. **No necesitas Ni servidores ni descarga de librerías.**

Una vez se abra la página **recomendamos que leas todos los pop-ups de información** para poder hacer un correcto uso de sus funciones.
También **recomendamos auriculares y un entorno sin mucho ruido de fondo.**

***¡Esperamos que te guste!***

Si quieres más información sobre nuestro proyecto, te la dejo a continuación, **no es necesario que la leas, a menos que quieras conocer *problemas* que tuvimos en la realización del proyecto** 

Hay funciones que no pudimos implementar, ya que necesitamos librerías externas que requieren node.js o bien un servido. **Nuestra prioridad era que fuera fácil para los usuarios.** Somos conscientes que otros grupos si se arriesgaron a usar librerías de este estilo y/o servidores, pero también somos consientes que el hecho de que todos tengamos las mismas versiones de los programas es algo complicado, es por ello que priorizamos que hasta una persona con un ordenador con Windows 7 pueda usarlo, aunque esto implique implementar funciones (que ya están diseñadas en librerías) desde 0. 

Nuestros mayores problemas, al no querer usar node.js ni servidores, han sido en aquellas funciones que requieren cálculos no triviales. Como la eliminación de ruido o el autotune, funciones que en principio formarían parte de nuestro proyecto, pero al necesitar tantos recursos con las implementaciones de esas funciones hechas desde 0 decidimos no implementarlas. 

Otro problema que tuvimos fue también con el efecto de reberb. Al estar trabajando con Web Audio API, la función del reberb no existe, al principio fue un problema, pero este fue uno de los que pudimos resolver, ¿Cómo? Pues aplicamos una función de eco, pero con un delay muy pequeño, lo que nos dio un efecto similar al reberb. 

Otro de los problemas que tuvimos al principio, es que queríamos que mientras te graba, puedas escucharte al mismo tiempo. No es posible hacerlo con Web Audio API, se entrecorta, ya que no le damos tiempo a que analice correctamente los datos que recibe como para poder devolverlo. Así que lo quitamos. 

**Hasta aquí llegan nuestros problemas.** 

¡Esperamos que te guste/gustara nuestro proyecto! :3
<3 <3 <3 <3 


