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
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwBWZUT4BORQDZtAFgDsB5Qe0aAHABoQmRMu3qATI70blj5Rq3PzygL5+1mhYeIREAAroAIYAxmAABACu+PFoBOIUTLAxUchg-EJIIGhiktKyCgjufOrmpgCM9cp8Rnp62ta2CAC0ijXmOu2Keo4aoxbmAUEYOATEkbEJyamo6dT0zGycvIKyJRJSMkWVKmrao+7KIwbmjor1nYgeekR6zc7a5oYG7aZTxTNQvNonEkik0vgMrRGExaAA1JgFPaiA7lY6IAx9IifFSuep8c6OeoaR4IZwGJxjEbKYZ1cz1f7BWZhACCACMovgINJCPFyHyonzcFBebFxIkwOhyJkAG5gSHxepIor7MpHUAnDQU5T1RzmPhtCxGOqk7rmDREc26Yn1bRNPjmgKBED4VAQODIkJzZGlQ4VRD1G6vPR8RQqYlGO58RymwPmIj3MN6Jq2n4G-zOplAkhkMA+1Hq+RPRwONqh8NagxRmM2DE1SPNfT1VxEgwMzOAuYREFLcGrSH5tX+qohhM0j4Evg6vRWWsIAz1qvNLVfKftSYdr2sjlcnkJfnRIUihJiiVSvMqlFD9FVQNEHV6g2uOo3AymjT1IjN63KL6feqKGMjKdmEABCqCJDAfIJBC4jxFEiTxGy0jxPKEAAE6rOIg5+je5oUsmf7NqGPwknO5KUi4Hi0jc7YBEAA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target:"Place un point",
                        actions:["addPoint"]
                    }
                }
            },

            "Place un point": {
                on: {
                    Escape: {
                        target: "Abandonne le la ligne actuelle",
                        actions:  ["abandon"],
                        cond: "Points>2"
                    },

                    MOUSECLICK: {
                        target: "Place un point",
                        internal: true,
                        actions:["addPoint"],
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
