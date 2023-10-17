import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwBWZUT4BORQDZtAFgDsB5Qe0aAHABoQmRMu3qATI70blj5Rq3PzygL5+1mhYeIREAAroAIYAxmAABACu+PFoBOLU9MxsnLyCsmhiktKyCggqatqObh56jgbmjooAjNa2CLVEesp8ztrmhgZ62qYBQRg4BMSRsQnJqajpFEywMVHIYPxCSCCFElIyO2XufOrmppqO5ooGzYpWNogAtM2nvop6dxq1Ho7a-oFdhNQtNonEkik0vgMrRGExaAA1JhbAqifYlI6IAyKU79FSuV5VRzNDRtRDOAxOb51ZQfc7mZpjIEhKZEACCACMovgINJCPFyAKogLcFB+bFxIkwOhyMsAG5gaHxZoonZ7YqHUBlRQaSnKZpXPh6VznBoGMkIJ7mDREa26EnNbTNHrWgKA-CoCBwVEswioooHUqIZoNLp6PiKFQkoxNXoWl6hlqKK7mfojex6JnBSZhUjkf3ozXycl-MMRqO6gyxxwWgynGM9fTNVzE25Z4Gsmbg+ZQ8QFjVBhDKcNEFTJv58bR8fV6B7tOtEBuaBrh4f9du+4ic7m8-D8wXREVihISqUysD9wOYochoj6w3GixGc7xjTNIjN+3KAb9L6ODc5sQABCqCJDAAoJL28RRIk8QctI8SKhAABOix9mqaIDte1qUp8P7NhGQyko8HT1FSLgeHSDSMm6QA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: "Place un point"
                }
            },

            "Place un point": {
                on: {
                    Escape: {
                        target: "Abandonne le la ligne actuelle",
                        cond: "Points>2"
                    },

                    MOUSECLICK: {
                        target: "Place un point",
                        internal: true,
                        cond: "Points < 10"
                    },

                    MOUSEMOVE: "Bouge le point au bon endroit"
                }
            },

            "Abandonne le la ligne actuelle": {
                on: {
                    "Event 1": "idle"
                }
            },

            "Bouge le point au bon endroit": {}
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
