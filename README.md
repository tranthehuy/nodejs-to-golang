# A tool to convert js to golang

## 1. Structure

Create file `source/index.js`. And run `npm run build`. It will convert this file and run by golang

```
// source/index.js
function main() {
  var sum_int = 0
  for (let index = 0; index < 10; index++) {
    for (let index2 = 0; index2 < 10; index2++) {
      console.log('index', index, ' index2', index2);
      sum_int = sum_int + index * 10 + index2;
    }
  }
}
```

Output file:
```
// dest/main.go
package main
import "fmt"

func main() {
  // TODO: please update types of params
  var sum_int int = 0
  for index := 0; index < 10; index++ {
    for index2 := 0; index2 < 10; index2++ {
      fmt.Println("index", index, " index2", index2)
      sum_int = (sum_int + (index * 10)) + index2
    }
  }
}
```

## 2. Name includes type of variables

Please notice that `var sum_int = 0` will become `var sum_int int = 0`.

Because `sum_int` has `_int`, it knew as `int` type.

## 3. Example with function

It maps `console.log` to `fmt.Println`

Input:

```
function foo_array_3_int(a_int, b_int) {
  let result_int = [0,1,2]
  result_int[0] = a_int
  result_int[1] = b_int
  result_int[2] = b_int + a_int
  return result_int
}

function main() {
  console.log(foo_array_3_int(1,3))
}
```

Output:

```
// created by Johnny Chen tools
package main
import "fmt"

func foo_array_3_int(a_int int, b_int int) [3]int{
  // TODO: please update types of params
  result_int := [...]int{0, 1, 2}
  result_int[0] = a_int
  result_int[1] = b_int
  result_int[2] = b_int + a_int
  return result_int
}

func main() {
  // TODO: please update types of params
  fmt.Println(foo_array_3_int(1, 3))
}
```