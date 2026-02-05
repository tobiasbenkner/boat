# Boat

Handle als Senior Graphics Programmer. Ich benötige einen Shader-Entwurf (z.B. in HLSL oder Unity Shader Graph) und eine Architektur-Übersicht für ein fortschrittliches Ozean-Rendering-System. Das System muss folgende technische Spezifikationen erfüllen:
 
1.  **Multi-cascade FFT:** Implementierung von drei Frequenzbändern (Ripples, Waves, Swells) für Details auf alle Distanzen.
2.  **JONSWAP Spektrum:** Wellengenerierung basierend auf physikalisch korrekten Windparametern.
3.  **Subsurface Scattering:** Lichttransmission durch Wellenkämme simulieren.
4.  **Schaum-Rendering:** Jacobian-basierte Erkennung für brechende Wellen sowie prozeduraler Oberflächenschaum.
5.  **Geometrie:** Clipmap-System mit LOD für eine nahtlose Darstellung bis zum Horizont.
 
Bitte erkläre die mathematischen Ansätze für die FFT-Kaskadierung und wie der Jacobian-Wert für den Schaum berechnet wird.
